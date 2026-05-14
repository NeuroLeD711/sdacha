from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Review, Project, User
from datetime import datetime, timezone
import math

reviews_bp = Blueprint('reviews', __name__, url_prefix='/api/reviews')


@reviews_bp.route('/project/<int:project_id>', methods=['POST'])
@jwt_required()
def create_review(project_id):
    user_id = int(get_jwt_identity())
    project = Project.query.get(project_id)
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    if project.status != 'COMPLETED':
        return jsonify({'error': 'Can only review completed projects'}), 400
    if user_id not in (project.customer_id, project.contractor_id):
        return jsonify({'error': 'Only project participants can leave reviews'}), 403

    existing = Review.query.filter_by(project_id=project_id, reviewer_id=user_id).first()
    if existing:
        return jsonify({'error': 'You have already reviewed this project'}), 400

    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body is required'}), 400

    rating = data.get('rating')
    comment = data.get('comment', '').strip()

    if rating is None or not isinstance(rating, int) or rating < 1 or rating > 5:
        return jsonify({'error': 'Rating must be an integer from 1 to 5'}), 400

    if user_id == project.customer_id:
        reviewee_id = project.contractor_id
    else:
        reviewee_id = project.customer_id

    review = Review(
        project_id=project_id,
        reviewer_id=user_id,
        reviewee_id=reviewee_id,
        rating=rating,
        comment=comment
    )

    db.session.add(review)
    db.session.flush()

    reviewee = User.query.get(reviewee_id)
    if not reviewee:
        return jsonify({'error': 'Review target user not found'}), 404

    all_reviews = Review.query.filter_by(reviewee_id=reviewee_id).all()
    total_weight = 0
    weighted_sum = 0
    now = datetime.now(timezone.utc)
    for r in all_reviews:
        age_days = max((now - r.created_at).total_seconds() / 86400, 1)
        weight = 1.0 / math.sqrt(age_days / 30)
        weighted_sum += r.rating * weight
        total_weight += weight

    reviewee.rating = weighted_sum / total_weight if total_weight > 0 else 0
    reviewee.total_reviews = len(all_reviews)

    db.session.commit()

    return jsonify({'review': review.to_dict(), 'message': 'Review submitted successfully'}), 201


@reviews_bp.route('/user/<int:user_id>', methods=['GET'])
def get_user_reviews(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    reviews = Review.query.filter_by(reviewee_id=user_id).order_by(Review.created_at.desc()).all()
    return jsonify({
        'user': user.to_dict(),
        'reviews': [r.to_dict() for r in reviews]
    }), 200
