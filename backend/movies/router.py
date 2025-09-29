# backend/movies/router.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime

from backend.authentication import security
from backend.authentication.schemas import UserResponse, UserBase
from . import schemas
from . import utils

router = APIRouter(prefix="/movies", tags=["movies"])

# TRANSACTION 1: Submit Review
@router.post("/{movie_id}/reviews", response_model=schemas.ReviewResponse)
def submit_review(
    movie_id: str,
    review: schemas.ReviewCreate,
    current_user: UserResponse = Depends(security.get_current_user)
):
    """Submit a review for a movie - TRANSACTION 1"""
    movies = utils.load_all_movies()
    movie = next((m for m in movies if m["id"] == movie_id), None)
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    # Check if user already reviewed this movie
    user_data = utils.load_user_data()
    existing_review = next(
        (r for r in user_data["user_reviews"] 
         if r["movie_id"] == movie_id and r["user_id"] == current_user.id), None
    )
    if existing_review:
        raise HTTPException(status_code=400, detail="You already reviewed this movie")
    
    new_review = {
        "id": f"user_review_{len(user_data['user_reviews']) + 1}",
        "movie_id": movie_id,
        "user_id": current_user.id,
        "username": current_user.username,
        "date_of_review": datetime.now().strftime("%d %B %Y"),
        "usefulness_vote": 0,
        "total_votes": 0,
        "rating": review.rating,
        "review_title": review.review_title,
        "review_text": review.review_text,
        "helpful_votes": 0,
        "is_dataset_review": False,
        "created_at": datetime.now().isoformat()
    }
    
    user_data["user_reviews"].append(new_review)
    utils.save_user_data(user_data)
    
    return new_review

# TRANSACTION 2: Rate Review (Helpful/Not Helpful)
@router.post("/reviews/{review_id}/vote")
def vote_on_review(
    review_id: str,
    helpful: bool = True,
    current_user: UserResponse = Depends(security.get_current_user)
):
    """Vote on a review as helpful - TRANSACTION 2"""
    user_data = utils.load_user_data()
    
    # Check if user already voted
    vote_key = f"{current_user.id}_{review_id}"
    if vote_key in user_data["review_votes"]:
        raise HTTPException(status_code=400, detail="You already voted on this review")
    
    # Find and update the review (could be in dataset reviews or user reviews)
    updated = False
    
    # Check user reviews first
    for review in user_data["user_reviews"]:
        if review["id"] == review_id:
            if helpful:
                review["helpful_votes"] = review.get("helpful_votes", 0) + 1
            updated = True
            break
    
    # If not found in user reviews, we'd need to handle dataset reviews differently
    # For now, we'll only track votes on user-generated reviews
    
    if not updated:
        raise HTTPException(status_code=404, detail="Review not found or cannot be voted on")
    
    user_data["review_votes"][vote_key] = helpful
    utils.save_user_data(user_data)
    
    return {"message": "Vote recorded", "helpful": helpful}

# TRANSACTION 3: Add to Watchlist
@router.post("/{movie_id}/watchlist")
def add_to_watchlist(
    movie_id: str,
    current_user: UserResponse = Depends(security.get_current_user)
):
    """Add movie to user's watchlist - TRANSACTION 3"""
    movies = utils.load_all_movies()
    movie = next((m for m in movies if m["id"] == movie_id), None)
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    user_data = utils.load_user_data()
    if str(current_user.id) not in user_data["watchlists"]:
        user_data["watchlists"][str(current_user.id)] = []
    
    watchlist = user_data["watchlists"][str(current_user.id)]
    if any(item["movie_id"] == movie_id for item in watchlist):
        raise HTTPException(status_code=400, detail="Movie already in watchlist")
    
    watchlist.append({
        "movie_id": movie_id,
        "added_at": datetime.now().isoformat(),
        "movie_title": movie["title"]
    })
    
    utils.save_user_data(user_data)
    return {"message": "Added to watchlist"}

# TRANSACTION 4: Report Review
@router.post("/reviews/{review_id}/report")
def report_review(
    review_id: str,
    report: schemas.ReportCreate,
    current_user: UserResponse = Depends(security.get_current_user)
):
    """Report a review for inappropriate content - TRANSACTION 4"""
    user_data = utils.load_user_data()
    
    # Check if user already reported this review
    existing_report = next(
        (r for r in user_data["reports"] 
         if r["review_id"] == review_id and r["user_id"] == current_user.id), None
    )
    if existing_report:
        raise HTTPException(status_code=400, detail="You already reported this review")
    
    new_report = {
        "review_id": review_id,
        "user_id": current_user.id,
        "username": current_user.username,
        "reason": report.reason,
        "reported_at": datetime.now().isoformat(),
        "status": "pending"
    }
    
    user_data["reports"].append(new_report)
    utils.save_user_data(user_data)
    
    return {"message": "Review reported successfully"}

# Movie browsing endpoints
@router.get("/", response_model=List[schemas.MovieResponse])
def get_movies(
    search: Optional[str] = Query(None),
    genre: Optional[str] = Query(None),
    min_rating: Optional[float] = Query(None),
    year: Optional[int] = Query(None)
):
    """Get movies with search and filter"""
    return utils.search_movies(search, genre, min_rating, year)

@router.get("/{movie_id}", response_model=schemas.MovieResponse)
def get_movie(movie_id: str):
    """Get specific movie details"""
    movies = utils.load_all_movies()
    movie = next((m for m in movies if m["id"] == movie_id), None)
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    return movie

@router.get("/{movie_id}/reviews", response_model=List[schemas.ReviewResponse])
def get_movie_reviews(movie_id: str):
    """Get reviews for a movie (both dataset and user reviews)"""
    dataset_reviews = utils.load_movie_reviews(movie_id)
    user_data = utils.load_user_data()
    user_reviews = [r for r in user_data["user_reviews"] if r["movie_id"] == movie_id]
    
    return dataset_reviews + user_reviews

@router.get("/user/watchlist")
def get_watchlist(current_user: UserResponse = Depends(security.get_current_user)):
    """Get user's watchlist"""
    user_data = utils.load_user_data()
    watchlist = user_data["watchlists"].get(str(current_user.id), [])
    
    # Enrich with movie data
    movies = utils.load_all_movies()
    enriched_watchlist = []
    for item in watchlist:
        movie = next((m for m in movies if m["id"] == item["movie_id"]), None)
        if movie:
            enriched_watchlist.append({
                **item,
                "movie_title": movie["title"],
                "movie_year": movie["datePublished"][:4],
                "movie_rating": movie["movieIMDbRating"]
            })
    
    return enriched_watchlist

@router.delete("/{movie_id}/watchlist")
def remove_from_watchlist(
    movie_id: str,
    current_user: UserResponse = Depends(security.get_current_user)
):
    """Remove movie from watchlist"""
    user_data = utils.load_user_data()
    watchlist = user_data["watchlists"].get(str(current_user.id), [])
    
    user_data["watchlists"][str(current_user.id)] = [
        item for item in watchlist if item["movie_id"] != movie_id
    ]
    
    utils.save_user_data(user_data)
    return {"message": "Removed from watchlist"}