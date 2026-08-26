import { Movie } from '../types';

export class MovieService {
  private static cachedMovies: Movie[] | null = null;
  private static externalApiUrl: string | null = null;

  /**
   * Set custom external Movie API endpoint URL if available
   */
  public static setExternalApiUrl(url: string) {
    this.externalApiUrl = url;
    this.cachedMovies = null; // reset cache
  }

  /**
   * Lazily loads new movies from separate Movie API or curated dataset.
   * This is ONLY called when the user opens the Movies section, avoiding app startup delays!
   */
  public static async getNewMovies(): Promise<Movie[]> {
    if (this.cachedMovies && this.cachedMovies.length > 0) {
      return this.cachedMovies;
    }

    try {
      if (this.externalApiUrl) {
        const res = await fetch(this.externalApiUrl);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            this.cachedMovies = data;
            return data;
          }
        }
      }
    } catch (e) {
      console.warn('MovieService external API fetch failed, falling back to curated library:', e);
    }

    // Curated high-performance Movie Catalog dataset (Marathi, Hindi, Action, Comedy)
    const curatedMovies: Movie[] = [
      {
        id: 'mv-01',
        title: 'Sairat',
        originalTitle: 'सैराट',
        posterUrl: 'https://m.media-amazon.com/images/M/MV5BMjIxNTU4MzY4MF5BMl5BanBnXkFtZTgwMzQ2MzU4ODE@._V1_FMjpg_UX1000_.jpg',
        bannerUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
        rating: 8.9,
        releaseYear: 2024,
        duration: '2h 54m',
        genres: ['Marathi', 'Romance', 'Drama'],
        language: 'mr',
        overview: 'A timeless Marathi masterpiece exploring love, passion, and societal boundaries in rural Maharashtra.',
        cast: ['Rinku Rajguru', 'Akash Thosar'],
        director: 'Nagraj Manjule',
        streamUrl: 'https://m3u-editor-over-https.suby.workers.dev/https://d2e9p6stg294ed.cloudfront.net/out/v1/00000000000000000000000000000000/manifest.m3u8',
        quality: '4K Ultra HD',
        isNewRelease: true,
        isTrending: true,
      },
      {
        id: 'mv-02',
        title: 'Pawankhind',
        originalTitle: 'पावनखिंड',
        posterUrl: 'https://m.media-amazon.com/images/M/MV5BNTI2YzA4MDUtNzNlNC00OTI5LTg4NDEtNmVhZDZhNmVlMTJkXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg',
        bannerUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1200&q=80',
        rating: 9.1,
        releaseYear: 2024,
        duration: '2h 32m',
        genres: ['Marathi', 'Action', 'Historical'],
        language: 'mr',
        overview: 'The heroic last stand of Baji Prabhu Deshpande and 300 Maratha warriors at Ghodkhind to protect Chhatrapati Shivaji Maharaj.',
        cast: ['Chinmay Mandlekar', 'Mrinal Kulkarni', 'Ajay Purkar'],
        director: 'Digpal Lanjekar',
        streamUrl: 'https://m3u-editor-over-https.suby.workers.dev/https://d2e9p6stg294ed.cloudfront.net/out/v1/00000000000000000000000000000000/manifest.m3u8',
        quality: '4K Ultra HD',
        isNewRelease: true,
        isTrending: true,
      },
      {
        id: 'mv-03',
        title: 'Jawan (Hindi 2024)',
        posterUrl: 'https://m.media-amazon.com/images/M/MV5BMjBhNWJiMjktN2ZiOC00N2ZhLTlhNzctYGRhNGFkOTIxYTI5XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg',
        bannerUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1200&q=80',
        rating: 8.4,
        releaseYear: 2024,
        duration: '2h 49m',
        genres: ['Hindi', 'Action', 'Thriller'],
        language: 'hi',
        overview: 'A high-octane action thriller highlighting a father-son duo fighting against corruption across the nation.',
        cast: ['Shah Rukh Khan', 'Nayanthara', 'Vijay Sethupathi'],
        director: 'Atlee',
        streamUrl: 'https://m3u-editor-over-https.suby.workers.dev/https://d2e9p6stg294ed.cloudfront.net/out/v1/00000000000000000000000000000000/manifest.m3u8',
        quality: '4K Ultra HD',
        isNewRelease: true,
        isTrending: true,
      },
      {
        id: 'mv-04',
        title: 'Subhedar',
        originalTitle: 'सुभेदार',
        posterUrl: 'https://m.media-amazon.com/images/M/MV5BOGFiZWMwYmMtODBiMi00NzBhLWE0M2ItNmUyMTJjYTg2ZTlkXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg',
        bannerUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80',
        rating: 8.8,
        releaseYear: 2024,
        duration: '2h 28m',
        genres: ['Marathi', 'Action', 'Drama'],
        language: 'mr',
        overview: 'Subhedar Tanhaji Malusare pledge to capture Sinhagad fort for Swarajya.',
        cast: ['Chinmay Mandlekar', 'Ajay Purkar'],
        director: 'Digpal Lanjekar',
        streamUrl: 'https://m3u-editor-over-https.suby.workers.dev/https://d2e9p6stg294ed.cloudfront.net/out/v1/00000000000000000000000000000000/manifest.m3u8',
        quality: '1080p Full HD',
        isNewRelease: true,
      },
      {
        id: 'mv-05',
        title: 'Stree 2',
        posterUrl: 'https://m.media-amazon.com/images/M/MV5BNTBkOWM5NWItN2U4NC00M2IwLWE3YTMtZTMwNTNhNTA5MWE3XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg',
        bannerUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
        rating: 8.6,
        releaseYear: 2024,
        duration: '2h 25m',
        genres: ['Hindi', 'Comedy', 'Horror'],
        language: 'hi',
        overview: 'The town of Chanderi is haunted once again by a new headless spirit Sarkata.',
        cast: ['Shraddha Kapoor', 'Rajkummar Rao', 'Pankaj Tripathi'],
        director: 'Amar Kaushik',
        streamUrl: 'https://m3u-editor-over-https.suby.workers.dev/https://d2e9p6stg294ed.cloudfront.net/out/v1/00000000000000000000000000000000/manifest.m3u8',
        quality: '4K Ultra HD',
        isNewRelease: true,
        isTrending: true,
      },
      {
        id: 'mv-06',
        title: 'Kalki 2898 AD',
        posterUrl: 'https://m.media-amazon.com/images/M/MV5BMjA2M2U0OTgtMDFlNC00NWY4LWIxNGMtODE3ZDAzYjM1NWViXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg',
        bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
        rating: 8.7,
        releaseYear: 2024,
        duration: '3h 01m',
        genres: ['Hindi', 'Action', 'Sci-Fi'],
        language: 'hi',
        overview: 'A modern avatar of Vishnu descends to Earth in a dystopian post-apocalyptic world to protect humanity.',
        cast: ['Prabhas', 'Amitabh Bachchan', 'Kamal Haasan', 'Deepika Padukone'],
        director: 'Nag Ashwin',
        streamUrl: 'https://m3u-editor-over-https.suby.workers.dev/https://d2e9p6stg294ed.cloudfront.net/out/v1/00000000000000000000000000000000/manifest.m3u8',
        quality: '4K Ultra HD',
        isNewRelease: true,
      },
      {
        id: 'mv-07',
        title: 'Ved',
        originalTitle: 'वेड',
        posterUrl: 'https://m.media-amazon.com/images/M/MV5BNTQ2M2FlOWYtMDcwOC00Y2Q2LWIzYTUtZTRiMDYzNWI5YWJmXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg',
        bannerUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
        rating: 8.3,
        releaseYear: 2023,
        duration: '2h 28m',
        genres: ['Marathi', 'Romance', 'Drama'],
        language: 'mr',
        overview: 'Satya, an aspiring cricketer whose heart was broken, finds redemption through unconditional love.',
        cast: ['Riteish Deshmukh', 'Genelia Deshmukh'],
        director: 'Riteish Deshmukh',
        streamUrl: 'https://m3u-editor-over-https.suby.workers.dev/https://d2e9p6stg294ed.cloudfront.net/out/v1/00000000000000000000000000000000/manifest.m3u8',
        quality: '1080p Full HD',
      },
      {
        id: 'mv-08',
        title: 'Animal',
        posterUrl: 'https://m.media-amazon.com/images/M/MV5BNGViM2M4NmUtMmE3ZC00NDRlLWIwNDMtMTk1NDNmNzA5Mjg3XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg',
        bannerUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80',
        rating: 8.1,
        releaseYear: 2024,
        duration: '3h 21m',
        genres: ['Hindi', 'Action', 'Crime'],
        language: 'hi',
        overview: 'A fierce father-son bond pushes a man into a dark underworld of retribution and blood feud.',
        cast: ['Ranbir Kapoor', 'Anil Kapoor', 'Bobby Deol'],
        director: 'Sandeep Reddy Vanga',
        streamUrl: 'https://m3u-editor-over-https.suby.workers.dev/https://d2e9p6stg294ed.cloudfront.net/out/v1/00000000000000000000000000000000/manifest.m3u8',
        quality: '4K Ultra HD',
      },
    ];

    this.cachedMovies = curatedMovies;
    return curatedMovies;
  }
}
