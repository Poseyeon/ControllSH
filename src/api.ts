import axios, { AxiosResponse } from 'axios';

/**
 * Base URL for the API server.
 */
const BASE_URL = 'http://localhost:3000';

/**
 * Performs a login request to the API.
 * 
 * @param company - The company name for login.
 * @param username - The username for login.
 * @param password - The password for login.
 * @returns A promise that resolves to the AxiosResponse if successful.
 * @throws Will throw an error if the request fails.
 */
export const login = async (company: string, username: string, password: string): Promise<AxiosResponse> => {
  try {
    const response = await axios.post(`${BASE_URL}/api/login`, {
      company,
      username,
      password,
    });
    return response;
  } catch (error: any) {
    throw error;
  }
};
