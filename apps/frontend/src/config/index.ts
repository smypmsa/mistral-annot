interface Config {
  apiUrl: string;
  maxFileSize: number;
}

const config: Config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  maxFileSize: Number(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || 10),
};

export default config;
