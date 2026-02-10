// Vehicle types — mirrors the website exactly

export type VehicleType = 'car' | 'bike';
export type VehicleStatus = 'draft' | 'pending_verification' | 'approved' | 'rejected';

export interface Vehicle {
    id: string;
    owner_id: string;
    title: string;
    vehicle_type: VehicleType;
    brand: string;
    model: string;
    year: number;
    price_per_day: number;
    location: string;
    latitude?: number;
    longitude?: number;
    description: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    vehicle_status: VehicleStatus;
    registration_number?: string;
    owner_phone?: string;
    owner_email?: string;
    pan_card_url?: string;
    aadhaar_front_url?: string;
    aadhaar_back_url?: string;
    rc_front_url?: string;
    rc_back_url?: string;
    insurance_url?: string;
    verified_at?: string;
    verified_by_admin_id?: string;
    rejection_reason?: string;
    security_deposit_text?: string;
}

export interface VehicleImage {
    id: string;
    vehicle_id: string;
    image_url: string;
    is_primary: boolean;
    created_at: string;
}

export interface VehicleWithImages extends Vehicle {
    images: VehicleImage[];
}

export interface VehicleFormData {
    title: string;
    vehicle_type: VehicleType;
    brand: string;
    model: string;
    year: number;
    price_per_day: number;
    location: string;
    latitude?: number;
    longitude?: number;
    description: string;
    is_active: boolean;
    registration_number?: string;
    owner_phone?: string;
    owner_email?: string;
}

export interface VehicleWithOwner extends VehicleWithImages {
    owner?: { id: string; full_name: string; created_at: string };
}

export interface VehicleFilters {
    type?: 'car' | 'bike';
    minPrice?: number;
    maxPrice?: number;
    location?: string;
    sort?: 'price_asc' | 'price_desc' | 'newest';
    page?: number;
    limit?: number;
}

export interface VehicleSearchResult {
    vehicles: VehicleWithImages[];
    total: number;
    page: number;
    totalPages: number;
}

export const vehicleStatusConfig: Record<VehicleStatus, { label: string; color: string; icon: string }> = {
    draft: { label: 'Draft', color: '#71717a', icon: '📝' },
    pending_verification: { label: 'Pending', color: '#f59e0b', icon: '⏳' },
    approved: { label: 'Approved', color: '#22c55e', icon: '✅' },
    rejected: { label: 'Rejected', color: '#ef4444', icon: '❌' },
};
