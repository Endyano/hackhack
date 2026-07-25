from fastapi import HTTPException


class AppError(HTTPException):
    """Raise with a machine-readable error code + human message.

    The handler registered in main.py returns these to the client as
    {"error": CODE, "message": "..."} at the top level of the JSON body
    (not nested under "detail"), per the API contract.
    """

    def __init__(self, status_code: int, error: str, message: str):
        super().__init__(status_code=status_code, detail={"error": error, "message": message})
