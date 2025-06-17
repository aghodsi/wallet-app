import { useState } from "react";

interface TestDataResponse {
  success: boolean;
  message: string;
  data?: any;
}

interface TestDataHookReturn {
  isLoading: boolean;
  error: string | null;
  generateComplete: (preset?: "minimal" | "standard" | "extensive") => Promise<TestDataResponse>;
  generateAssets: () => Promise<TestDataResponse>;
  generateTransactions: (portfolioId: number, count?: number) => Promise<TestDataResponse>;
  generateCustom: (config: {
    portfolioCount?: number;
    transactionsPerPortfolio?: number;
    includeRecurring?: boolean;
    includeDividends?: boolean;
    startDate?: string;
    endDate?: string;
  }) => Promise<TestDataResponse>;
  getInfo: () => Promise<TestDataResponse>;
}

export function useTestData(): TestDataHookReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const makeRequest = async (formData: FormData): Promise<TestDataResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/testData", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.message || "Unknown error occurred");
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Network error occurred";
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  };

  const generateComplete = async (preset: "minimal" | "standard" | "extensive" = "standard"): Promise<TestDataResponse> => {
    const formData = new FormData();
    formData.append("action", "generateComplete");
    formData.append("preset", preset);
    return makeRequest(formData);
  };

  const generateAssets = async (): Promise<TestDataResponse> => {
    const formData = new FormData();
    formData.append("action", "generateAssets");
    return makeRequest(formData);
  };

  const generateTransactions = async (portfolioId: number, count?: number): Promise<TestDataResponse> => {
    const formData = new FormData();
    formData.append("action", "generateTransactions");
    formData.append("portfolioId", portfolioId.toString());
    if (count !== undefined) {
      formData.append("count", count.toString());
    }
    return makeRequest(formData);
  };

  const generateCustom = async (config: {
    portfolioCount?: number;
    transactionsPerPortfolio?: number;
    includeRecurring?: boolean;
    includeDividends?: boolean;
    startDate?: string;
    endDate?: string;
  }): Promise<TestDataResponse> => {
    const formData = new FormData();
    formData.append("action", "generateCustom");
    
    if (config.portfolioCount !== undefined) {
      formData.append("portfolioCount", config.portfolioCount.toString());
    }
    if (config.transactionsPerPortfolio !== undefined) {
      formData.append("transactionsPerPortfolio", config.transactionsPerPortfolio.toString());
    }
    if (config.includeRecurring !== undefined) {
      formData.append("includeRecurring", config.includeRecurring.toString());
    }
    if (config.includeDividends !== undefined) {
      formData.append("includeDividends", config.includeDividends.toString());
    }
    if (config.startDate) {
      formData.append("startDate", config.startDate);
    }
    if (config.endDate) {
      formData.append("endDate", config.endDate);
    }

    return makeRequest(formData);
  };

  const getInfo = async (): Promise<TestDataResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/testData", {
        method: "GET",
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.message || "Unknown error occurred");
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Network error occurred";
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    generateComplete,
    generateAssets,
    generateTransactions,
    generateCustom,
    getInfo,
  };
}

// Convenience functions for one-off usage without hooks
export async function generateTestDataQuick(preset: "minimal" | "standard" | "extensive" = "standard") {
  const formData = new FormData();
  formData.append("action", "generateComplete");
  formData.append("preset", preset);

  try {
    const response = await fetch("/api/testData", {
      method: "POST",
      body: formData,
    });
    return await response.json();
  } catch (error) {
    console.error("Failed to generate test data:", error);
    return { success: false, message: "Failed to generate test data" };
  }
}

export async function generateTestAssetsQuick() {
  const formData = new FormData();
  formData.append("action", "generateAssets");

  try {
    const response = await fetch("/api/testData", {
      method: "POST",
      body: formData,
    });
    return await response.json();
  } catch (error) {
    console.error("Failed to generate test assets:", error);
    return { success: false, message: "Failed to generate test assets" };
  }
}

export async function generateTestTransactionsQuick(portfolioId: number, count?: number) {
  const formData = new FormData();
  formData.append("action", "generateTransactions");
  formData.append("portfolioId", portfolioId.toString());
  if (count !== undefined) {
    formData.append("count", count.toString());
  }

  try {
    const response = await fetch("/api/testData", {
      method: "POST",
      body: formData,
    });
    return await response.json();
  } catch (error) {
    console.error("Failed to generate test transactions:", error);
    return { success: false, message: "Failed to generate test transactions" };
  }
}
