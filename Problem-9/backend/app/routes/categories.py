from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.category import Category
from app.models.transaction import Transaction
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse

router = APIRouter(prefix="/api/categories", tags=["Categories"])

@router.get("", response_model=List[CategoryResponse])
def get_categories(
    type: Optional[str] = Query(None, description="Filter by type (Expense or Income)"),
    db: Session = Depends(get_db)
):
    query = db.query(Category)
    if type:
        query = query.filter(Category.type == type)
    categories = query.order_by(Category.name.asc()).all()
    
    results = []
    for cat in categories:
        tx_stats = db.query(
            func.count(Transaction.id),
            func.coalesce(func.sum(Transaction.amount), 0.0)
        ).filter(Transaction.category_id == cat.id).first()

        tx_count = tx_stats[0] if tx_stats else 0
        total_amt = float(tx_stats[1]) if tx_stats else 0.0

        cat_dict = CategoryResponse.from_orm(cat).dict()
        cat_dict["transaction_count"] = tx_count
        cat_dict["total_amount"] = total_amt
        results.append(cat_dict)
    return results

@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(cat_in: CategoryCreate, db: Session = Depends(get_db)):
    existing = db.query(Category).filter(func.lower(Category.name) == func.lower(cat_in.name)).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Category '{cat_in.name}' already exists.")
    
    cat = Category(
        name=cat_in.name,
        type=cat_in.type,
        icon=cat_in.icon or "tag",
        color=cat_in.color or "#6366F1",
        description=cat_in.description,
        is_system=False
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat

@router.get("/{category_id}", response_model=CategoryResponse)
def get_category(category_id: int, db: Session = Depends(get_db)):
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    tx_stats = db.query(
        func.count(Transaction.id),
        func.coalesce(func.sum(Transaction.amount), 0.0)
    ).filter(Transaction.category_id == cat.id).first()
    
    res = CategoryResponse.from_orm(cat).dict()
    res["transaction_count"] = tx_stats[0] if tx_stats else 0
    res["total_amount"] = float(tx_stats[1]) if tx_stats else 0.0
    return res

@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(category_id: int, cat_in: CategoryUpdate, db: Session = Depends(get_db)):
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    
    if cat_in.name and cat_in.name.lower() != cat.name.lower():
        existing = db.query(Category).filter(func.lower(Category.name) == func.lower(cat_in.name)).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"Category '{cat_in.name}' already exists.")

    update_data = cat_in.dict(exclude_unset=True)
    for field, val in update_data.items():
        setattr(cat, field, val)

    db.commit()
    db.refresh(cat)
    return cat

@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(category_id: int, db: Session = Depends(get_db)):
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Check if category has transactions attached
    tx_count = db.query(func.count(Transaction.id))\
        .filter(Transaction.category_id == cat.id)\
        .scalar() or 0
    if tx_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete category '{cat.name}' because {tx_count} transactions are associated with it. Reassign or delete those transactions first."
        )

    db.delete(cat)
    db.commit()
    return None
