# backend/movies/utils.py
import json
import csv
import os
from typing import List, Dict, Any
from datetime import datetime

# Simple relative path from project root
MOVIES_DATA_DIR = "backend/data/movie_list"

def load_all_movies() -> List[Dict[str, Any]]:
    """Load all movies from the data directory"""
    movies = []
    
    print(f"Loading movies from: {MOVIES_DATA_DIR}")
    print(f"Full path: {os.path.abspath(MOVIES_DATA_DIR)}")
    
    if not os.path.exists(MOVIES_DATA_DIR):
        print(f"❌ Directory not found: {MOVIES_DATA_DIR}")
        return movies
    
    movie_folders = os.listdir(MOVIES_DATA_DIR)
    print(f"Found {len(movie_folders)} movie folders")
    
    for movie_folder in movie_folders:
        movie_path = f"{MOVIES_DATA_DIR}/{movie_folder}"
        
        # Only process folders
        if not os.path.isdir(movie_path):
            continue
            
        # Load metadata
        metadata_file = f"{movie_path}/metadata.json"
        if os.path.exists(metadata_file):
            try:
                with open(metadata_file, 'r', encoding='utf-8') as f:
                    metadata = json.load(f)
                    metadata['id'] = movie_folder
                    movies.append(metadata)
                print(f"✅ {movie_folder}")
            except Exception as e:
                print(f"❌ Error loading {movie_folder}: {e}")
        else:
            print(f"❌ No metadata.json in {movie_folder}")
            
    print(f"Successfully loaded {len(movies)} movies")
    return movies

def load_movie_reviews(movie_id: str) -> List[Dict[str, Any]]:
    """Load reviews for a specific movie from CSV"""
    reviews_file = f"{MOVIES_DATA_DIR}/{movie_id}/movieReviews.csv"
    reviews = []
    
    if os.path.exists(reviews_file):
        try:
            with open(reviews_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for i, row in enumerate(reader):
                    # Clean the rating field
                    rating_str = row["User's Rating out of 10"].strip()
                    try:
                        rating = int(rating_str) if rating_str and rating_str != '"' else 0
                    except ValueError:
                        rating = 0
                    
                    review = {
                        'id': f"{movie_id}_review_{i}",
                        'movie_id': movie_id,
                        'date_of_review': row['Date of Review'],
                        'username': row['User'],
                        'usefulness_vote': int(row['Usefulness Vote']),
                        'total_votes': int(row['Total Votes']),
                        'rating': rating,
                        'review_title': row['Review Title'],
                        'review_text': row.get('Review Text', ''),
                        'helpful_votes': 0,
                        'is_dataset_review': True
                    }
                    reviews.append(review)
        except Exception as e:
            print(f"Error loading reviews for {movie_id}: {e}")
    
    return reviews

def search_movies(
    query: str = None, 
    genre: str = None, 
    min_rating: float = None,
    year: int = None
) -> List[Dict[str, Any]]:
    """Search and filter movies"""
    movies = load_all_movies()
    
    filtered_movies = movies
    
    if query:
        filtered_movies = [m for m in filtered_movies if query.lower() in m['title'].lower()]
    
    if genre:
        filtered_movies = [m for m in filtered_movies if any(genre.lower() in g.lower() for g in m['movieGenres'])]
    
    if min_rating:
        filtered_movies = [m for m in filtered_movies if m['movieIMDbRating'] >= min_rating]
    
    if year:
        filtered_movies = [m for m in filtered_movies if str(year) in m['datePublished']]
    
    return filtered_movies

# User data storage for transactions
USER_DATA_FILE = "backend/data/user_data.json"

def load_user_data() -> Dict[str, Any]:
    """Load user-generated data (reviews, watchlist, etc.)"""
    if os.path.exists(USER_DATA_FILE):
        try:
            with open(USER_DATA_FILE, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading user data: {e}")
    
    return {
        "user_reviews": [],
        "watchlists": {},
        "review_votes": {},
        "reports": [],
        "penalties": {}
    }

def save_user_data(user_data: Dict[str, Any]):
    """Save user-generated data"""
    try:
        os.makedirs(os.path.dirname(USER_DATA_FILE), exist_ok=True)
        with open(USER_DATA_FILE, 'w') as f:
            json.dump(user_data, f, indent=2)
    except Exception as e:
        print(f"Error saving user data: {e}")

def get_user_review_stats(user_id: int) -> Dict[str, Any]:
    """Calculate user review statistics"""
    user_data = load_user_data()
    user_reviews = [r for r in user_data["user_reviews"] if r["user_id"] == user_id]
    
    if not user_reviews:
        return {"total_reviews": 0, "average_rating": 0, "helpful_votes_received": 0, "watchlist_count": 0}
    
    total_rating = sum(r["rating"] for r in user_reviews)
    helpful_votes = sum(r.get("helpful_votes", 0) for r in user_reviews)
    watchlist_count = len(user_data["watchlists"].get(str(user_id), []))
    
    return {
        "total_reviews": len(user_reviews),
        "average_rating": round(total_rating / len(user_reviews), 1),
        "helpful_votes_received": helpful_votes,
        "watchlist_count": watchlist_count
    }