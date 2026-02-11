
import React from 'react';
import { UserRole, PigGroup, Sex, Pig, FeedStatus, GroupProfile, FeedType } from './types.ts';

export const ADMIN_EMAIL = '2ke23ec133@kleit.ac.in';

export const GROUP_PROFILES: GroupProfile[] = [
  { id: PigGroup.PIGLET, name: 'Piglets', baseRationPerKg: 0.05 },
  { id: PigGroup.GROWER, name: 'Growers', baseRationPerKg: 0.035 },
  { id: PigGroup.PREGNANT, name: 'Pregnant Sows', baseRationPerKg: 0.02 },
  { id: PigGroup.ADULT, name: 'Adults', baseRationPerKg: 0.025 },
  { id: PigGroup.QUARANTINE, name: 'Quarantine', baseRationPerKg: 0.015 },
];

export const FEED_TYPES: FeedType[] = [
  { id: '1', name: 'Starter Mix (A)', protein: 18, energy: 3200, costPerKg: 0.85 },
  { id: '2', name: 'Grower Plus', protein: 16, energy: 3000, costPerKg: 0.70 },
  { id: '3', name: 'Standard Maintenance', protein: 14, energy: 2800, costPerKg: 0.60 },
];

const BREEDS = ['Landrace', 'Yorkshire', 'Duroc', 'Hampshire'];

export const generateSeedData = (): Pig[] => {
  const pigs: Pig[] = [];
  const count = 100;
  
  for (let i = 1; i <= count; i++) {
    const groupValues = Object.values(PigGroup);
    const group = groupValues[Math.floor(Math.random() * groupValues.length)];
    const weight = Math.floor(Math.random() * (120 - 10 + 1)) + 10;
    
    pigs.push({
      id: `p-${i}`,
      tagId: `TAG-${1000 + i}`,
      name: `Pig #${i}`,
      dob: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 365).toISOString().split('T')[0],
      group,
      sex: Math.random() > 0.5 ? Sex.MALE : Sex.FEMALE,
      breed: BREEDS[Math.floor(Math.random() * BREEDS.length)],
      weight: weight,
      weightHistory: [{ date: new Date().toISOString(), value: weight }],
      isPregnant: group === PigGroup.PREGNANT,
      photoUrl: `https://picsum.photos/seed/pig${i}/200/200`,
      lastIntakeKg: 0,
      status: FeedStatus.PENDING
    });
  }
  return pigs;
};
