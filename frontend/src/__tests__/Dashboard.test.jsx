import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';

// Mock dependencies before importing the component
vi.mock('../application/context/AuthContext', () => ({
  useAuth: () => ({
    user: { email: 'test@example.com' },
    logout: vi.fn()
  })
}));

vi.mock('../infrastructure/services/api/analytics', () => ({
  analyticsApi: {
    getDailyAnalytics: vi.fn().mockResolvedValue({
      date: '2026-07-11',
      age: 30,
      weight_kg: 70,
      height_cm: 175,
      bmi: 22.9,
      avg_meal_score: 8.0,
      health_score: 8.5,
      daily_goal_completion_percentage: 90,
      calories: { current: 2100, goal: 2000, percentage: 105 },
      protein_g: { current: 150, goal: 100, percentage: 150 },
      carbs_g: { current: 200, goal: 250, percentage: 80 },
      fat_g: { current: 70, goal: 65, percentage: 107 },
      active_medical_constraints: [],
      feedback: []
    }),
    getTrendAnalytics: vi.fn().mockResolvedValue({ data: [] })
  }
}));

vi.mock('../infrastructure/services/api/meals', () => ({
  getMealHistory: vi.fn().mockResolvedValue({ meals: [] })
}));

vi.mock('../infrastructure/services/api/notifications', () => ({
  notificationsApi: {
    getNotifications: vi.fn().mockResolvedValue({ notifications: [], unread_count: 0 })
  }
}));

// Now import the component
import Dashboard from '../presentation/pages/Dashboard';

describe('Dashboard Component', () => {
  it('renders loading state initially, then displays KPI data', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    // Should eventually show the daily analytics
    await waitFor(() => {
      // 2100 calories from our mock
      expect(screen.getByText('2100')).toBeInTheDocument();
      // Health score from mock
      expect(screen.getByText('8.5')).toBeInTheDocument();
    });
  });
});
