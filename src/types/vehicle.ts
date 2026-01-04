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
    description: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    // KYC fields
    vehicle_status: VehicleStatus;
    registration_number?: string;
    owner_phone?: string;
    owner_email?: string;
    // Owner KYC documents
    pan_card_url?: string;
    aadhaar_front_url?: string;
    aadhaar_back_url?: string;
    // Vehicle documents
    rc_front_url?: string;
    rc_back_url?: string;
    insurance_url?: string;
    // Verification
    verified_at?: string;
    verified_by_admin_id?: string;
    rejection_reason?: string;
    // NEW: Security deposit info
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
    description: string;
    is_active: boolean;
    // KYC fields (optional - filled in separately)
    registration_number?: string;
    owner_phone?: string;
    owner_email?: string;
}

// KYC Document upload types
export interface KYCDocuments {
    pan_card?: File | string;
    aadhaar_front?: File | string;
    aadhaar_back?: File | string;
    rc_front?: File | string;
    rc_back?: File | string;
    insurance?: File | string;
}

// Status badge config
export const vehicleStatusConfig: Record<VehicleStatus, {
    label: string;
    className: string;
    icon: string;
}> = {
    draft: {
        label: 'Draft',
        className: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
        icon: '📝',
    },
    pending_verification: {
        label: 'Pending Verification',
        className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        icon: '⏳',
    },
    approved: {
        label: 'Approved',
        className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        icon: '✅',
    },
    rejected: {
        label: 'Rejected',
        className: 'bg-red-500/10 text-red-400 border-red-500/20',
        icon: '❌',
    },
};
