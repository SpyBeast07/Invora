import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings
from app.api.v1.router import api_router

# Setup structured logs logging configuration
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan events coordinator.
    Handles startup logging, pool health checks, and shutdown resource cleaning.
    """
    logger.info("Initializing Invora Backend Services...")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"CORS Allowed Origins: {settings.BACKEND_CORS_ORIGINS}")
    
    yield
    
    logger.info("De-initializing Invora Backend Services... Goodbye!")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Production-ready inventory, warehouse catalog, and order fulfillment tracking system.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ------------------------------------------------------------------------------
# Register CORSMiddleware
# ------------------------------------------------------------------------------
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# ------------------------------------------------------------------------------
# Custom Global Exception Handlers
# ------------------------------------------------------------------------------

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Formats validation errors into standardized readable objects."""
    logger.warning(f"Request validation failure on path {request.url.path}: {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Unprocessable Entity",
            "message": "Input request validation failed.",
            "details": exc.errors(),
        },
    )


@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    """Interceptors to prevent raw DB error structures from leaking in production."""
    logger.error(f"Critical Database Error occurred on {request.url.path}: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Database Error",
            "message": "A database operation encountered an unexpected failure. Please contact administrator.",
        },
    )


# ------------------------------------------------------------------------------
# API Router Mounting
# ------------------------------------------------------------------------------
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", status_code=200, include_in_schema=False)
async def root_redirect():
    """Index redirect to interactive OpenAPI interactive docs."""
    return JSONResponse(
        content={
            "app": settings.PROJECT_NAME,
            "status": "online",
            "version": "1.0.0",
            "documentation": "/docs",
            "health_check": f"{settings.API_V1_STR}/health"
        }
    )
