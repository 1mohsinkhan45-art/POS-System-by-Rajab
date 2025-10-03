// This file provides the data access layer for the POS application, using Supabase.
import { supabase } from './supabaseClient';
import type { User as AuthUser } from '@supabase/supabase-js';

// Helper function for generating unique IDs (still useful for some client-side logic)
const generateId = () => Math.random().toString(36).substr(2, 9);

// Simple string "hashing" for demonstration. In a real app, use a proper library like bcrypt.
const simpleHash = (password: string): string => {
    // This is not secure. For demonstration only.
    return `hashed_${password}`;
};

// --- TYPES ---
export type BusinessType = 'fast-food' | 'bbq-restaurant' | 'hotel';
export type DisplayLanguage = 'english' | 'urdu' | 'both';
export type ReceiptFontSize = 'small' | 'medium' | 'large';

export interface StaffPermissions {
    canAccessAdminDashboard: boolean;
}

// Represents both Owner (from Supabase Auth) and Staff (from our custom table)
export interface User {
    id: string;
    name: string;
    email?: string;
    username?: string;
    role: 'owner' | 'staff';
    // Staff details are merged into this type
    fatherName?: string;
    cnic?: string;
    dob?: string;
    contact?: string;
    emergencyContact?: string;
    permissions?: StaffPermissions;
    // For staff, we store the hash client-side after "login"
    passwordHash?: string; 
    // For owner, this will be the business ID
    businessId?: string;
}


export interface Product {
    id: string;
    name: string;
    urduName: string;
    price: number; // Selling price
    purchasePrice: number; // Cost price
    category: string;
    business_id?: string;
}

export interface CartItem {
    product: Product;
    quantity: number;
}

export interface Sale {
    id: string;
    items: CartItem[];
    subtotal: number;
    taxAmount: number;
    total: number; // Grand Total
    staffName: string;
    customerName?: string;
    timestamp: number; // Kept as number for compatibility, will be converted from string
}

export interface BusinessDetails {
    id?: string;
    businessName: string;
    businessType: BusinessType;
    ownerName: string;
    email: string;
    mobileNumber: string;
    passcode: string; // Plaintext for recovery logic
    displayLanguage: DisplayLanguage;
    logoUrl?: string;
    receiptFooter?: string;
    taxRate?: number;
    receiptFontSize?: ReceiptFontSize;
    activated_license_key_hash?: number | null;
}

export interface ThemeSettings {
    primaryColor: string;
    secondaryColor: string;
    dangerColor: string;
    successColor: string;
    fontFamily: string;
    backgroundColor: string;
    cardBackgroundColor: string;
    textColor: string;
    textLightColor: string;
    borderColor: string;
    accent1: string;
    accent2: string;
    accent3: string;
    accent4: string;
    accent5: string;
    accent6: string;
}

// Initial sample data based on business type
const sampleProducts: Record<BusinessType, Omit<Product, 'id'>[]> = {
    'fast-food': [
        { name: 'Zinger Burger', urduName: 'زنگر برگر', price: 450, purchasePrice: 280, category: 'Burgers' },
        { name: 'Chicken Patty Burger', urduName: 'چکن پیٹی برگر', price: 350, purchasePrice: 220, category: 'Burgers' },
        { name: 'Cola', urduName: 'کولا', price: 90, purchasePrice: 50, category: 'Drinks' },
    ],
    'bbq-restaurant': [
        { name: 'Chicken Tikka', urduName: 'چکن تکہ', price: 450, purchasePrice: 280, category: 'BBQ' },
        { name: 'Seekh Kebab (Chicken)', urduName: 'سیخ کباب (چکن)', price: 180, purchasePrice: 110, category: 'BBQ' },
        { name: 'Naan', urduName: 'نان', price: 30, purchasePrice: 15, category: 'Breads' },
    ],
    'hotel': [
        { name: 'Halwa Puri', urduName: 'حلوہ پوری', price: 250, purchasePrice: 150, category: 'Breakfast' },
        { name: 'Chicken Karahi (Full)', urduName: 'چکن کڑاہی (فل)', price: 1600, purchasePrice: 1000, category: 'Main Course' },
        { name: 'Tea', urduName: 'چائے', price: 100, purchasePrice: 50, category: 'Drinks' },
    ],
};

// --- HELPER FUNCTIONS ---
const licenseKeyHash = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash * 31) + char;
        hash |= 0;
    }
    return hash;
};

const VALID_KEY_HASHES = new Set([
    1465839238, -1316686012, 1944256136, 178203588, -2012624447, -203417734, -1899147192,
    1455325833, 1081555559, -1297924747, 102573216, -1149867517, -199926861, 715507845,
    -1335914105, 1904797046, -188377741, -126306515, 1851996519, -1859368557, -1889895077,
    -921287995, 1853664770, -1838965945, -738980347, 856403063, 1904944513, -1116246011,
    -79277685, -1777271816, 513360451, 1978249826, 114639917, -174549114, 1500021667
]);

// --- API FUNCTIONS ---
export const db = {
    // --- Setup & Auth ---
    async hasOwner(): Promise<boolean> {
        // We replace the RPC call with a direct query to check for the existence of a business.
        // This avoids potential permission issues with the 'is_setup_complete' function for the anon key.
        // Using { count: 'exact', head: true } is efficient as it only fetches the count, not the data.
        const { count, error } = await supabase
            .from('businesses')
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error("Error checking setup status:", error.message || error);
            return false;
        }
        
        return (count ?? 0) > 0;
    },

    async setupOwner(
        ownerInfo: { name: string; email: string; businessName: string; businessType: BusinessType; mobileNumber: string; },
        password: string,
        passcode: string
    ): Promise<void> {
        // 1. Sign up the user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: ownerInfo.email,
            password: password,
            options: { data: { full_name: ownerInfo.name } }
        });
        if (authError) throw new Error(authError.message);
        if (!authData.user) throw new Error("Could not create user.");

        // 2. Create the business details record
        const businessDetails: Omit<BusinessDetails, 'id'> = {
            businessName: ownerInfo.businessName,
            businessType: ownerInfo.businessType,
            ownerName: ownerInfo.name,
            email: ownerInfo.email.toLowerCase(),
            mobileNumber: ownerInfo.mobileNumber,
            passcode: passcode,
            displayLanguage: 'both',
            logoUrl: '',
            receiptFooter: 'Thank you for your purchase!',
            taxRate: 0,
            receiptFontSize: 'medium',
        };
        const { data: busData, error: busError } = await supabase
            .from('businesses')
            .insert({ ...businessDetails, owner_user_id: authData.user.id })
            .select()
            .single();
        if (busError) throw new Error("Could not save business details: " + busError.message);

        // 3. Pre-load sample products
        const productsToInsert = sampleProducts[ownerInfo.businessType].map(p => ({ ...p, business_id: busData.id }));
        const { error: productError } = await supabase.from('products').insert(productsToInsert);
        if (productError) console.error("Could not add sample products:", productError.message || productError);
    },

    async authenticateUser(emailOrUsername: string, password_raw: string): Promise<User | null> {
        const credential = emailOrUsername.toLowerCase().trim();

        // 1. Try to authenticate as Owner via Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: credential,
            password: password_raw,
        });

        if (!authError && authData.user) {
            // Fetch business details for owner
            const { data: busData, error: busError } = await supabase
                .from('businesses')
                .select('id, ownerName')
                .eq('owner_user_id', authData.user.id)
                .single();
            if (busError) throw new Error("Could not fetch business details for owner.");
            
            return {
                id: authData.user.id,
                email: authData.user.email,
                name: busData.ownerName,
                role: 'owner',
                businessId: busData.id,
            };
        }

        // 2. If Supabase Auth fails, try to authenticate as Staff from our custom table
        // This part is less secure but matches original app logic.
        const { data: allBusinesses, error: allBusError } = await supabase.from('businesses').select('id, email');
        if (allBusError) {
             console.error("Could not fetch businesses for staff login:", allBusError.message || allBusError);
             return null;
        }

        for (const business of allBusinesses) {
            const { data: staff, error: staffError } = await supabase
                .from('staff_users')
                .select('*')
                .eq('business_id', business.id)
                .eq('username', credential);
            
            if (staff && staff.length > 0) {
                 const staffMember = staff[0];
                 const passwordHash = simpleHash(password_raw);
                 if (staffMember.password_hash === passwordHash) {
                    return {
                        id: staffMember.id,
                        name: staffMember.name,
                        username: staffMember.username,
                        role: 'staff',
                        permissions: { canAccessAdminDashboard: staffMember.can_access_admin_dashboard },
                        businessId: staffMember.business_id,
                    };
                 }
            }
        }
        
        return null; // No user found
    },
    
    async getCurrentUser(): Promise<{user: AuthUser, details: BusinessDetails} | null> {
        const { data: { session }} = await supabase.auth.getSession();
        if(!session) return null;

        const { data: details, error } = await supabase
            .from('businesses')
            .select('*')
            .eq('owner_user_id', session.user.id)
            .single();

        if(error || !details) {
            console.error("Could not fetch business details for current user:", error?.message || "Details not found");
            return null;
        }
        return { user: session.user, details };
    },
    
    async logout() {
        await supabase.auth.signOut();
    },

    // --- License Management ---
    async isLicensed(): Promise<boolean> {
        const { data: details, error } = await supabase.from('businesses').select('activated_license_key_hash').limit(1).single();

        if (error || !details) {
             // If no business is set up, they are not licensed
            return false;
        }
        
        return details.activated_license_key_hash ? VALID_KEY_HASHES.has(details.activated_license_key_hash) : false;
    },
    
    async activateLicense(key: string): Promise<boolean> {
        const normalizedKey = key.trim().toUpperCase();
        if (normalizedKey.length === 0) return false;

        // The DEMO key is now just a valid key. The logic is simplified.
        if (normalizedKey === 'DEMO-1HOUR-ACCESS' || VALID_KEY_HASHES.has(licenseKeyHash(normalizedKey))) {
            const hash = licenseKeyHash(normalizedKey);
// FIX: `this.getCurrentUser()` returns the user object directly, not wrapped in `data`.
            const ownerSession = await this.getCurrentUser();
            if(!ownerSession) {
                console.error("No owner found to activate license for.");
                // This case happens on first setup, which is okay.
                // We'll store the key hash in localStorage and apply it during setup.
                localStorage.setItem('pending_license_hash', hash.toString());
                return true;
            }

            const { error } = await supabase
                .from('businesses')
                .update({ activated_license_key_hash: hash })
// FIX: Use the user ID from the session object.
                .eq('owner_user_id', ownerSession.user.id);
            
            return !error;
        }
        return false;
    },

    // --- Data Management ---
    async getProducts(businessId: string): Promise<Product[]> {
        const { data, error } = await supabase.from('products').select('*').eq('business_id', businessId);
        if (error) throw new Error(error.message);
        return data || [];
    },
    async addProduct(productData: Omit<Product, 'id'>): Promise<void> {
        const { error } = await supabase.from('products').insert(productData);
        if (error) throw new Error(error.message);
    },
    async updateProduct(updatedProduct: Product): Promise<void> {
        const { error } = await supabase.from('products').update(updatedProduct).eq('id', updatedProduct.id);
        if (error) throw new Error(error.message);
    },
    async deleteProduct(productId: string): Promise<void> {
        const { error } = await supabase.from('products').delete().eq('id', productId);
        if (error) throw new Error(error.message);
    },

    async getStaff(businessId: string): Promise<User[]> {
        const { data, error } = await supabase.from('staff_users').select('*').eq('business_id', businessId);
        if (error) throw new Error(error.message);
        return (data || []).map(s => ({
            id: s.id,
            name: s.name,
            username: s.username,
            role: 'staff',
            contact: s.contact,
            cnic: s.cnic,
            permissions: { canAccessAdminDashboard: s.can_access_admin_dashboard },
            businessId: s.business_id,
        }));
    },
    async addStaff(staffData: any, password_raw: string, businessId: string): Promise<void> {
        const { error } = await supabase.from('staff_users').insert({
            business_id: businessId,
            name: staffData.name,
            username: staffData.username,
            contact: staffData.contact,
            cnic: staffData.cnic,
            can_access_admin_dashboard: staffData.permissions.canAccessAdminDashboard,
            password_hash: simpleHash(password_raw)
        });
        if (error) throw new Error(error.message);
    },
    async updateStaff(updatedStaff: User, newPassword?: string): Promise<void> {
        const updateData: any = {
            name: updatedStaff.name,
            username: updatedStaff.username,
            contact: updatedStaff.contact,
            cnic: updatedStaff.cnic,
            can_access_admin_dashboard: updatedStaff.permissions?.canAccessAdminDashboard
        };
        if (newPassword) {
            updateData.password_hash = simpleHash(newPassword);
        }
        const { error } = await supabase.from('staff_users').update(updateData).eq('id', updatedStaff.id);
        if (error) throw new Error(error.message);
    },
    async deleteStaff(staffId: string): Promise<void> {
        const { error } = await supabase.from('staff_users').delete().eq('id', staffId);
        if (error) throw new Error(error.message);
    },
    
    async getBusinessDetails(businessId: string): Promise<BusinessDetails> {
        const { data, error } = await supabase.from('businesses').select('*').eq('id', businessId).single();
        if (error) throw new Error(error.message);
        return data;
    },
    
    async updateBusinessDetails(businessId: string, details: Partial<BusinessDetails>): Promise<void> {
        const { error } = await supabase.from('businesses').update(details).eq('id', businessId);
        if (error) throw new Error(error.message);
    },
    
    async getSales(businessId: string): Promise<Sale[]> {
        const { data, error } = await supabase.from('sales').select('*').eq('business_id', businessId);
        if (error) throw new Error(error.message);
        return (data || []).map(s => ({ ...s, timestamp: new Date(s.timestamp).getTime() }));
    },
    async addSale(saleData: Omit<Sale, 'id' | 'timestamp'>, businessId: string): Promise<void> {
        const { error } = await supabase.from('sales').insert({ ...saleData, business_id: businessId });
        if (error) throw new Error(error.message);
    },
    async clearSalesData(businessId: string): Promise<void> {
        const { error } = await supabase.from('sales').delete().eq('business_id', businessId);
        if (error) throw new Error(error.message);
    },
    
// FIX: Implement missing data management functions
    async exportData(businessId: string): Promise<string> {
        const [products, staff, sales, details] = await Promise.all([
            this.getProducts(businessId),
            this.getStaff(businessId),
            this.getSales(businessId),
            this.getBusinessDetails(businessId),
        ]);
        const data = { products, staff, sales, details };
        return JSON.stringify(data, null, 2);
    },
    async importData(businessId: string, jsonString: string): Promise<void> {
        const data = JSON.parse(jsonString);
        if (!data.products || !data.sales || !data.staff || !data.details) {
            throw new Error("Invalid backup file format.");
        }
        await this.clearSalesData(businessId);
        await supabase.from('products').delete().eq('business_id', businessId);
        await supabase.from('staff_users').delete().eq('business_id', businessId);

        if (data.products && data.products.length > 0) {
            const productsToInsert = data.products.map(({ id, ...p }: Product) => ({ ...p, business_id: businessId }));
            await supabase.from('products').insert(productsToInsert);
        }
        if (data.sales && data.sales.length > 0) {
            const salesToInsert = data.sales.map(({ id, ...s }: Sale) => ({ ...s, business_id: businessId, timestamp: new Date(s.timestamp).toISOString() }));
            await supabase.from('sales').insert(salesToInsert);
        }
        console.warn("Staff data import is not supported in this version to avoid security issues with passwords.");
        const { id, ...detailsToUpdate } = data.details;
        await this.updateBusinessDetails(businessId, detailsToUpdate);
    },
    async resetApplication(businessId: string): Promise<void> {
        await this.clearSalesData(businessId);
        await supabase.from('products').delete().eq('business_id', businessId);
        await supabase.from('staff_users').delete().eq('business_id', businessId);
    },

// FIX: Implement missing theme management functions
    async getThemeSettings(businessId: string): Promise<ThemeSettings | null> {
        const { data, error } = await supabase.from('businesses').select('theme_settings').eq('id', businessId).single();
        if (error) {
            console.error("Error fetching theme settings:", error.message || error);
            return null;
        }
        return data.theme_settings as ThemeSettings | null;
    },
    async setThemeSettings(businessId: string, theme: ThemeSettings): Promise<void> {
        const { error } = await supabase.from('businesses').update({ theme_settings: theme }).eq('id', businessId);
        if (error) throw new Error(error.message);
    },
    async resetThemeSettings(businessId: string): Promise<void> {
        const { error } = await supabase.from('businesses').update({ theme_settings: null }).eq('id', businessId);
        if (error) throw new Error(error.message);
    },
    
    // Recovery functions need to be implemented using serverless functions for security.
    // This is a placeholder for now.
    async recoverOwner(mobileNumber: string, passcode: string): Promise<{ name: string; email: string } | null> {
       console.warn("Recovery is not securely implemented yet. This is a placeholder.");
       const { data, error } = await supabase.from('businesses').select('ownerName, email').eq('mobile_number', mobileNumber).eq('passcode', passcode).single();
       if(error || !data) return null;
       return { name: data.ownerName, email: data.email };
    },
    async updateOwnerCredentials(mobileNumber: string, creds: { name: string; email: string; password: string }): Promise<boolean> {
        console.warn("Updating owner credentials via recovery is not securely implemented yet.");
        // This requires admin privileges to update a user's password, needs an Edge Function.
        return false;
    },
};