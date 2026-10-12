import uvicorn

if __name__ == "__main__":
    print("==========================================")
    print("  Starting AI Monitoring Backend Server   ")
    print("  API Docs : http://127.0.0.1:8000/docs   ")
    print("==========================================")
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
