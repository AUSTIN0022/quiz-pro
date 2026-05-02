import type { Contest, ContestFilters, ApiResponse } from '@/lib/types';
import contestsData from '@/seed/contests.json';

// Simulated API delay for realistic UX
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class ContestService {
  private contests: Contest[] = contestsData as Contest[];

  async getContests(filters?: ContestFilters): Promise<ApiResponse<Contest[]>> {
    await delay(300);
    
    let filtered = [...this.contests];
    
    if (filters?.status) {
      filtered = filtered.filter(c => c.status === filters.status);
    }
    
    if (filters?.category) {
      filtered = filtered.filter(c => c.category === filters.category);
    }
    
    if (filters?.difficulty) {
      filtered = filtered.filter(c => c.difficulty === filters.difficulty);
    }
    
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(c => 
        c.title.toLowerCase().includes(searchLower) ||
        c.description.toLowerCase().includes(searchLower) ||
        c.category.toLowerCase().includes(searchLower)
      );
    }
    
    return {
      success: true,
      data: filtered
    };
  }

  async getContestBySlug(slug: string): Promise<ApiResponse<Contest>> {
    await delay(200);
    
    const contest = this.contests.find(c => c.slug === slug);
    
    if (!contest) {
      return {
        success: false,
        error: 'Contest not found'
      };
    }
    
    return {
      success: true,
      data: contest
    };
  }

  async getContestById(id: string): Promise<ApiResponse<Contest>> {
    await delay(200);
    
    const contest = this.contests.find(c => c.id === id);
    
    if (!contest) {
      return {
        success: false,
        error: 'Contest not found'
      };
    }
    
    return {
      success: true,
      data: contest
    };
  }

  async getCategories(): Promise<ApiResponse<string[]>> {
    await delay(100);
    
    const categories = [...new Set(this.contests.map(c => c.category))];
    
    return {
      success: true,
      data: categories
    };
  }

  async getPublishedContests(): Promise<ApiResponse<Contest[]>> {
    return this.getContests({ status: 'published' });
  }

  async getActiveContests(): Promise<ApiResponse<Contest[]>> {
    return this.getContests({ status: 'active' });
  }

  async getFeaturedContests(limit: number = 3): Promise<ApiResponse<Contest[]>> {
    await delay(300);
    
    const featured = this.contests
      .filter(c => c.status === 'published' || c.status === 'active')
      .sort((a, b) => b.currentParticipants - a.currentParticipants)
      .slice(0, limit);
    
    return {
      success: true,
      data: featured
    };
  }
}

export const contestService = new ContestService();
