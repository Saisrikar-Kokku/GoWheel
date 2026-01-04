'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { VehicleFilters } from '@/services/vehicleService';

interface VehicleFilterPanelProps {
    filters: VehicleFilters;
    onFiltersChange: (filters: VehicleFilters) => void;
    priceRange: { min: number; max: number };
    totalResults: number;
    isOpen: boolean;
    onToggle: () => void;
}

export default function VehicleFilterPanel({
    filters,
    onFiltersChange,
    priceRange,
    totalResults,
    isOpen,
    onToggle,
}: VehicleFilterPanelProps) {
    const [localMinPrice, setLocalMinPrice] = useState(filters.minPrice ?? priceRange.min);
    const [localMaxPrice, setLocalMaxPrice] = useState(filters.maxPrice ?? priceRange.max);
    const [locationInput, setLocationInput] = useState(filters.location ?? '');

    useEffect(() => {
        setLocalMinPrice(filters.minPrice ?? priceRange.min);
        setLocalMaxPrice(filters.maxPrice ?? priceRange.max);
    }, [filters.minPrice, filters.maxPrice, priceRange]);

    const handleTypeChange = (value: string) => {
        if (value === 'all') {
            onFiltersChange({ ...filters, type: undefined, page: 1 });
        } else {
            onFiltersChange({ ...filters, type: value as 'car' | 'bike', page: 1 });
        }
    };

    const handleSortChange = (value: string) => {
        onFiltersChange({ ...filters, sort: value as VehicleFilters['sort'], page: 1 });
    };

    const handlePriceChange = (values: number[]) => {
        setLocalMinPrice(values[0]);
        setLocalMaxPrice(values[1]);
    };

    const handlePriceCommit = () => {
        onFiltersChange({
            ...filters,
            minPrice: localMinPrice > priceRange.min ? localMinPrice : undefined,
            maxPrice: localMaxPrice < priceRange.max ? localMaxPrice : undefined,
            page: 1,
        });
    };

    const handleLocationSearch = () => {
        onFiltersChange({
            ...filters,
            location: locationInput.trim() || undefined,
            page: 1,
        });
    };

    const handleClearFilters = () => {
        setLocalMinPrice(priceRange.min);
        setLocalMaxPrice(priceRange.max);
        setLocationInput('');
        onFiltersChange({
            sort: 'newest',
            page: 1,
        });
    };

    const hasActiveFilters = filters.type || filters.minPrice || filters.maxPrice || filters.location;

    return (
        <>
            {/* Mobile Filter Toggle */}
            <div className="lg:hidden mb-4">
                <Button
                    variant="outline"
                    onClick={onToggle}
                    className="w-full justify-between"
                >
                    <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        Filters
                        {hasActiveFilters && (
                            <Badge variant="secondary" className="bg-primary/20 text-primary">Active</Badge>
                        )}
                    </span>
                    <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </Button>
            </div>

            <AnimatePresence>
                {(isOpen || typeof window !== 'undefined' && window.innerWidth >= 1024) && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="lg:block overflow-hidden lg:overflow-visible"
                    >
                        <Card className="bg-card/50 border-border/50">
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                        </svg>
                                        Filters
                                    </CardTitle>
                                    {hasActiveFilters && (
                                        <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-muted-foreground text-xs">
                                            Clear all
                                        </Button>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {totalResults} vehicle{totalResults !== 1 ? 's' : ''} found
                                </p>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Vehicle Type */}
                                <div>
                                    <Label className="text-sm font-medium mb-2 block">Vehicle Type</Label>
                                    <Select
                                        value={filters.type || 'all'}
                                        onValueChange={handleTypeChange}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All types" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">🚘 All Types</SelectItem>
                                            <SelectItem value="car">🚗 Cars</SelectItem>
                                            <SelectItem value="bike">🏍️ Bikes</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Price Range */}
                                <div>
                                    <Label className="text-sm font-medium mb-3 block">Price Range (per day)</Label>
                                    <div className="px-1">
                                        <Slider
                                            value={[localMinPrice, localMaxPrice]}
                                            min={priceRange.min}
                                            max={priceRange.max}
                                            step={5}
                                            onValueChange={handlePriceChange}
                                            onValueCommit={handlePriceCommit}
                                            className="mb-3"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                                        <span className="font-medium text-foreground">₹{localMinPrice}</span>
                                        <span>to</span>
                                        <span className="font-medium text-foreground">₹{localMaxPrice}</span>
                                    </div>
                                </div>

                                {/* Location Search */}
                                <div>
                                    <Label className="text-sm font-medium mb-2 block">Location</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="City, area..."
                                            value={locationInput}
                                            onChange={(e) => setLocationInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleLocationSearch()}
                                            className="flex-1"
                                        />
                                        <Button variant="outline" size="icon" onClick={handleLocationSearch}>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </Button>
                                    </div>
                                </div>

                                {/* Sort */}
                                <div>
                                    <Label className="text-sm font-medium mb-2 block">Sort By</Label>
                                    <Select
                                        value={filters.sort || 'newest'}
                                        onValueChange={handleSortChange}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="newest">🆕 Newest First</SelectItem>
                                            <SelectItem value="price_asc">💰 Price: Low to High</SelectItem>
                                            <SelectItem value="price_desc">💎 Price: High to Low</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Active Filters Tags */}
                                {hasActiveFilters && (
                                    <div className="pt-2 border-t border-border/50">
                                        <Label className="text-xs text-muted-foreground mb-2 block">Active filters:</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {filters.type && (
                                                <Badge variant="secondary" className="gap-1">
                                                    {filters.type === 'car' ? '🚗 Car' : '🏍️ Bike'}
                                                    <button
                                                        onClick={() => handleTypeChange('all')}
                                                        className="ml-1 hover:text-destructive"
                                                    >
                                                        ×
                                                    </button>
                                                </Badge>
                                            )}
                                            {(filters.minPrice || filters.maxPrice) && (
                                                <Badge variant="secondary" className="gap-1">
                                                    ₹{filters.minPrice || priceRange.min} - ₹{filters.maxPrice || priceRange.max}
                                                    <button
                                                        onClick={() => {
                                                            setLocalMinPrice(priceRange.min);
                                                            setLocalMaxPrice(priceRange.max);
                                                            onFiltersChange({ ...filters, minPrice: undefined, maxPrice: undefined, page: 1 });
                                                        }}
                                                        className="ml-1 hover:text-destructive"
                                                    >
                                                        ×
                                                    </button>
                                                </Badge>
                                            )}
                                            {filters.location && (
                                                <Badge variant="secondary" className="gap-1">
                                                    📍 {filters.location}
                                                    <button
                                                        onClick={() => {
                                                            setLocationInput('');
                                                            onFiltersChange({ ...filters, location: undefined, page: 1 });
                                                        }}
                                                        className="ml-1 hover:text-destructive"
                                                    >
                                                        ×
                                                    </button>
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
