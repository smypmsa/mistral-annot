from doc_extractor.core.extractor import DocumentExtractor

def main():
    print("Document Extractor Starting...")
    
    try:
        extractor = DocumentExtractor()
        extractor.process_folder()
        print("\n✓ Processing complete!")
    except ValueError as e:
        print(f"Configuration error: {e}")
        print("Please set MISTRAL_API_KEY in your .env file")
    except Exception as e:
        print(f"Unexpected error: {e}")

if __name__ == "__main__":
    main()