'use client';
import { useState, useEffect } from 'react';
import type { UserProfile } from '@/lib/types';

export function useFreeTrial(userProfile?: UserProfile | null) {
    // With new system, trial is handled in canAccessLesson directly
    // This hook is kept for compatibility
    return { trialDaysUsed: 0, isTrialLoading: false };
}
