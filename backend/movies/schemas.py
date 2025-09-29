# backend/movies/schemas.py - REMOVE UserResponse
from pydantic import BaseModel, Field
from typing import Optional, List

class MovieMetadata(BaseModel):
    title: str
    movieIMDbRating: float
    totalRatingCount: int
    totalUserReviews: str
    totalCriticReviews: str
    metaScore: Optional[str] = None
    movieGenres: List[str]
    directors: List[str]
    datePublished: str
    creators: List[str]
    mainStars: List[str]
    description: str
    duration: int

class MovieResponse(MovieMetadata):
    id: str

class ReviewBase(BaseModel):
    rating: int = Field(ge=1, le=10)
    review_title: str
    review_text: str

class ReviewCreate(ReviewBase):
    movie_id: str

class ReviewResponse(BaseModel):
    id: str
    movie_id: str
    user_id: int
    username: str
    date_of_review: str
    usefulness_vote: int
    total_votes: int
    rating: int
    review_title: str
    review_text: str
    helpful_votes: int = 0
    is_dataset_review: bool = False

class WatchlistItem(BaseModel):
    movie_id: str
    added_at: str
    movie_title: Optional[str] = None
    movie_year: Optional[str] = None
    movie_rating: Optional[float] = None

class ReportCreate(BaseModel):
    review_id: str
    reason: str

class UserReviewStats(BaseModel):
    total_reviews: int
    average_rating: float
    helpful_votes_received: int
    watchlist_count: int