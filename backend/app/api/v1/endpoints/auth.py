from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.core.security import create_access_token
from app.schemas.user import UserCreate, UserResponse, Token
from app.services.auth import AuthService

router = APIRouter()


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    user_in: UserCreate,
    db: AsyncSession = Depends(deps.get_db),
):
    """
    Register a new store user/operator.
    Open signup endpoint for demonstration and initial setup.
    """
    return await AuthService.register_user(db, user_in)


@router.post("/login", response_model=Token)
async def login(
    db: AsyncSession = Depends(deps.get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
):
    """
    OAuth2 compatible token login.
    Takes email as 'username' and returns a standard Bearer access token.
    Enables native interactive authorization inside Swagger docs (/docs).
    """
    user = await AuthService.authenticate_user(
        db, email=form_data.username, password=form_data.password
    )
    access_token = create_access_token(subject=user.id)
    return Token(access_token=access_token)
