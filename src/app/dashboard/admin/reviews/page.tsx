'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import PageWrapper from '@/components/layout/PageWrapper';

interface Review {
    id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    reviewer_name: string;
    vehicle_title: string;
}

export default function AdminReviewsPage() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchReviews = async () => {
        try {
            const res = await fetch('/api/admin/reviews');
            if (!res.ok) throw new Error('Failed to fetch reviews');
            const data = await res.json();
            setReviews(data.reviews);
        } catch (err) {
            setError('Failed to load reviews');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                        key={star}
                        className={`w-4 h-4 ${star <= rating ? 'text-yellow-400' : 'text-muted-foreground/30'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                ))}
            </div>
        );
    };

    // Calculate average rating
    const avgRating = reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : '0';

    return (
        <PageWrapper className="container mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <Link href="/dashboard/admin" className="hover:text-primary transition-colors">
                            Admin
                        </Link>
                        <span>/</span>
                        <span className="text-foreground">Reviews</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold mb-1">Review Oversight</h1>
                            <p className="text-muted-foreground">
                                Monitor user reviews (read-only).
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="gap-1">
                                ⭐ {avgRating} avg
                            </Badge>
                            <Badge variant="secondary">
                                {reviews.length} reviews
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Reviews List */}
                <Card className="bg-card/50 border-border/50">
                    <CardHeader className="pb-3 border-b border-border/50">
                        <CardTitle className="text-lg">All Reviews</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="p-6 space-y-4">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="flex items-start gap-4">
                                        <Skeleton className="w-10 h-10 rounded-full" />
                                        <div className="flex-1">
                                            <Skeleton className="h-4 w-32 mb-2" />
                                            <Skeleton className="h-3 w-full mb-1" />
                                            <Skeleton className="h-3 w-2/3" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : error ? (
                            <div className="p-6 text-center text-red-400">{error}</div>
                        ) : reviews.length === 0 ? (
                            <div className="p-6 text-center text-muted-foreground">
                                No reviews found.
                            </div>
                        ) : (
                            <div className="divide-y divide-border/50">
                                {reviews.map((review) => (
                                    <div
                                        key={review.id}
                                        className="p-4 hover:bg-muted/30 transition-colors"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center text-white font-bold">
                                                {review.reviewer_name?.charAt(0).toUpperCase() || '?'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                                                    <div>
                                                        <span className="font-medium">{review.reviewer_name}</span>
                                                        <span className="text-muted-foreground mx-2">→</span>
                                                        <span className="text-muted-foreground">{review.vehicle_title}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {renderStars(review.rating)}
                                                        <span className="text-sm text-muted-foreground">
                                                            {formatDate(review.created_at)}
                                                        </span>
                                                    </div>
                                                </div>
                                                {review.comment && (
                                                    <p className="text-sm text-muted-foreground">
                                                        &ldquo;{review.comment}&rdquo;
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </PageWrapper>
    );
}
