import { DownloadTask, User, UserRole } from '../types';

// This 'google' object is only available in the Apps Script environment.
declare const google: any;

// --- SERVICE INTERFACE ---
// Defines a common interface for both real and mock services.
interface IGoogleSheetsService {
    login(username: string, password: string): Promise<User | null>;
    logout(): Promise<void>;
    getUsers(): Promise<User[]>;
    addUser(user: User): Promise<User>;
    updateUser(user: User): Promise<User>;
    deleteUser(username: string): Promise<{ username: string }>;
    getTasks(): Promise<DownloadTask[]>;
    addTasks(tasks: DownloadTask[]): Promise<DownloadTask[]>;
    updateTask(task: DownloadTask): Promise<DownloadTask>;
}

// Helper function to normalize a user object from the backend
const normalizeUser = (userFromBackend: any): User | null => {
    if (!userFromBackend) {
        return null;
    }

    const username = userFromBackend.username || userFromBackend.Username;

    // The username is the absolute minimum requirement. If it's missing, we can't use the record.
    if (!username) {
        console.warn("Skipping user record from backend due to missing username:", userFromBackend);
        return null;
    }

    const user: User = {
        username: username,
        // If name is missing, default to the username to ensure visibility in the UI.
        name: userFromBackend.name || userFromBackend.Name || username,
        // Default to a basic role if missing to prevent filtering out the user.
        role: userFromBackend.role || userFromBackend.Role || UserRole.OPERADOR_IMPO,
        email: userFromBackend.email || userFromBackend.Email || '',
    };
    
    return user;
};


// --- PRODUCTION SERVICE ---
// Communicates with the real Google Apps Script backend. Used in production builds.
class GoogleSheetsService implements IGoogleSheetsService {
    private serverRequest(action: string, payload?: any): Promise<any> {
        return new Promise((resolve, reject) => {
            google.script.run
                .withSuccessHandler((response: { success: boolean, data?: any, message?: string }) => {
                    if (response.success) {
                        resolve(response.data);
                    } else {
                        reject(new Error(response.message || 'An unknown error occurred in the backend.'));
                    }
                })
                .withFailureHandler((error: Error) => {
                    reject(error);
                })
                .apiGateway({ action, payload });
        });
    }

    async login(username: string, password: string): Promise<User | null> {
        const userFromBackend = await this.serverRequest('login', { username, password });
        return normalizeUser(userFromBackend);
    }

    async logout(): Promise<void> {
        // No server-side action needed for simple password auth
        return Promise.resolve();
    }

    async getUsers(): Promise<User[]> {
        const responseData = await this.serverRequest('getUsers');
        
        let usersFromBackend: any[] = [];

        // Make the response handling very robust to find the user array.
        if (Array.isArray(responseData)) {
            // Case 1: The response data is the array itself.
            usersFromBackend = responseData;
        } else if (responseData && typeof responseData === 'object') {
            // Case 2: The response data is an object. Look for a property that is an array.
            // Prioritize common keys like 'users' or 'data'.
            if (Array.isArray(responseData.users)) {
                usersFromBackend = responseData.users;
            } else if (Array.isArray(responseData.data)) {
                usersFromBackend = responseData.data;
            } else {
                // As a last resort, find the first property that is an array.
                const arrayInData = Object.values(responseData).find(value => Array.isArray(value));
                if (arrayInData && Array.isArray(arrayInData)) {
                    usersFromBackend = arrayInData;
                }
            }
        }
    
        if (!Array.isArray(usersFromBackend)) {
            console.error("Could not find a user array in the backend response.", responseData);
            return [];
        }

        return usersFromBackend
            .map(user => normalizeUser(user))
            .filter((u): u is User => u !== null);
    }
    
    async addUser(user: User): Promise<User> {
        return this.serverRequest('addUser', user);
    }
    async updateUser(user: User): Promise<User> {
        return this.serverRequest('updateUser', user);
    }
    async deleteUser(username: string): Promise<{ username: string }> {
        return this.serverRequest('deleteUser', { username });
    }
    async getTasks(): Promise<DownloadTask[]> {
        const tasks = await this.serverRequest('getTasks');
        return Array.isArray(tasks) ? tasks : [];
    }
    async addTasks(tasks: DownloadTask[]): Promise<DownloadTask[]> {
        return this.serverRequest('addTasks', tasks);
    }
    async updateTask(task: DownloadTask): Promise<DownloadTask> {
        return this.serverRequest('updateTask', task);
    }
}


// --- MOCK SERVICE ---
// Simulates the backend for local development (`npm run dev`) using an in-memory database.
class MockGoogleSheetsService implements IGoogleSheetsService {
    private mockDb: { users: User[], tasks: DownloadTask[] } = {
        users: [
            { username: 'admin', name: 'Admin User', role: UserRole.ADMIN, password: 'admin', email: 'admin@example.com' },
            { username: 'jcalderon', name: 'Julio Calderon', role: UserRole.ADMIN, password: 'password123', email: 'julio.calderon@example.com' },
            { username: 'operador', name: 'Operator User', role: UserRole.OPERADOR_IMPO, password: 'password123' },
            { username: 'monitor', name: 'Monitor User', role: UserRole.MONITOR_IMPO, password: 'password123', email: 'monitor@example.com' },
        ],
        tasks: [],
    };
    private delay = (ms: number) => new Promise(res => setTimeout(res, ms));
    
    async login(username: string, password: string): Promise<User | null> {
        await this.delay(500);
        console.log(`[MOCK] login attempt for: ${username}`);
        const user = this.mockDb.users.find(u => u.username.toLowerCase() === username.toLowerCase());

        if (!user) {
            throw new Error('Usuario no encontrado.');
        }

        if (user.password !== password) {
            throw new Error('Contraseña incorrecta.');
        }
        
        const { password: _, ...userToReturn } = user;
        return JSON.parse(JSON.stringify(userToReturn));
    }

    async logout(): Promise<void> {
        await this.delay(100);
        console.log('[MOCK] logout called.');
        return Promise.resolve();
    }

    async getUsers(): Promise<User[]> {
        await this.delay(200);
        console.log('[MOCK] getUsers called');
        // Return users without their passwords
        return JSON.parse(JSON.stringify(this.mockDb.users.map(({ password, ...rest}) => rest)));
    }

    async addUser(user: User): Promise<User> {
        await this.delay(300);
        if (this.mockDb.users.some(u => u.username.toLowerCase() === user.username.toLowerCase())) {
            throw new Error(`[MOCK] User '${user.username}' already exists.`);
        }
        if (!user.password) {
            throw new Error(`[MOCK] Password is required to create a new user.`);
        }
        const newUser = { ...user };
        this.mockDb.users.push(newUser);
        console.log('[MOCK] addUser:', newUser);
        const { password, ...userToReturn } = newUser;
        return userToReturn;
    }
    async updateUser(user: User): Promise<User> {
        await this.delay(300);
        const index = this.mockDb.users.findIndex(u => u.username.toLowerCase() === user.username.toLowerCase());
        if (index === -1) throw new Error(`[MOCK] User '${user.username}' not found.`);
        
        // Update fields, but only update password if a new one is provided
        const existingUser = this.mockDb.users[index];
        existingUser.name = user.name;
        existingUser.role = user.role;
        existingUser.email = user.email;
        if (user.password) {
            existingUser.password = user.password;
        }
        
        console.log('[MOCK] updateUser:', existingUser);
        const { password, ...userToReturn } = existingUser;
        return userToReturn;
    }
    async deleteUser(username: string): Promise<{ username: string }> {
        await this.delay(300);
        this.mockDb.users = this.mockDb.users.filter(u => u.username.toLowerCase() !== username.toLowerCase());
        console.log(`[MOCK] deleteUser: ${username}`);
        return { username };
    }
    async getTasks(): Promise<DownloadTask[]> {
        await this.delay(400);
        console.log('[MOCK] getTasks called');
        return JSON.parse(JSON.stringify(this.mockDb.tasks));
    }
    async addTasks(tasks: DownloadTask[]): Promise<DownloadTask[]> {
        await this.delay(300);
        this.mockDb.tasks.push(...JSON.parse(JSON.stringify(tasks)));
        console.log('[MOCK] addTasks:', tasks);
        return tasks;
    }
    async updateTask(task: DownloadTask): Promise<DownloadTask> {
        await this.delay(100);
        const index = this.mockDb.tasks.findIndex(t => t.id === task.id);
        const taskCopy = JSON.parse(JSON.stringify(task));
        if (index > -1) {
            this.mockDb.tasks[index] = taskCopy;
        } else {
            this.mockDb.tasks.push(taskCopy);
        }
        console.log('[MOCK] updateTask:', task.id);
        return task;
    }
}

// --- EXPORT LOGIC ---
// We determine the environment at runtime by checking for the existence of the
// Google Apps Script `google.script.run` object.
let serviceInstance: IGoogleSheetsService;

const isProduction = typeof google !== 'undefined' && google.script && google.script.run;

if (isProduction) {
  // We are in the Google Apps Script environment.
  serviceInstance = new GoogleSheetsService();
} else {
  // We are in a local development environment (e.g., `vite dev`).
  console.log("Running in development mode. Using Mock Google Sheets Service.");
  serviceInstance = new MockGoogleSheetsService();
}

export const sheets = serviceInstance;