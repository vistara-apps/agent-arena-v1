// Storage utilities for IPFS and GitHub integration

export interface AgentCard {
  name: string;
  address: string;
  domain: string;
  skills: string[];
  endpoints: string[];
  reputationScore: number;
  description?: string;
  avatar?: string;
}

export interface Receipt {
  agentAddress: string;
  bountyId: string;
  taskInputRefs: string[];
  resultHash: string;
  timestamp: number;
  signature: string;
  resultURI?: string;
}

// IPFS storage functions
export const ipfs = {
  // Upload JSON data to IPFS (using a service like Pinata, Infura, or similar)
  uploadJSON: async (data: any): Promise<string> => {
    try {
      // In production, integrate with IPFS pinning service
      // For demo purposes, we'll simulate the upload
      const mockCID = `ipfs://${Date.now().toString(36)}${Math.random().toString(36).substr(2)}`;
      console.log('Mock IPFS upload:', data);
      return mockCID;
    } catch (error) {
      console.error('Failed to upload to IPFS:', error);
      throw new Error('IPFS upload failed');
    }
  },

  // Download JSON data from IPFS
  downloadJSON: async <T>(cid: string): Promise<T> => {
    try {
      // Remove ipfs:// prefix if present
      const cleanCID = cid.replace('ipfs://', '');

      // In production, use IPFS gateway
      const gatewayURL = `https://ipfs.io/ipfs/${cleanCID}`;

      const response = await fetch(gatewayURL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to download from IPFS:', error);
      throw new Error('IPFS download failed');
    }
  },
};

// GitHub storage functions
export const github = {
  // GitHub API configuration
  API_BASE: 'https://api.github.com',
  REPO_OWNER: process.env.NEXT_PUBLIC_GITHUB_OWNER || 'your-org',
  REPO_NAME: process.env.NEXT_PUBLIC_GITHUB_REPO || 'clipperverse-data',
  BRANCH: 'main',

  // Upload file to GitHub repository
  uploadFile: async (
    fileName: string,
    content: string,
    token?: string
  ): Promise<string> => {
    try {
      const apiToken = token || process.env.NEXT_PUBLIC_GITHUB_TOKEN;

      if (!apiToken) {
        throw new Error('GitHub token not configured');
      }

      // First, get the current file (if it exists) to get the SHA
      let sha: string | undefined;
      try {
        const getResponse = await fetch(
          `${github.API_BASE}/repos/${github.REPO_OWNER}/${github.REPO_NAME}/contents/${fileName}`,
          {
            headers: {
              Authorization: `token ${apiToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (getResponse.ok) {
          const fileData = await getResponse.json();
          sha = fileData.sha;
        }
      } catch (error) {
        // File doesn't exist, which is fine for new uploads
      }

      // Create or update the file
      const response = await fetch(
        `${github.API_BASE}/repos/${github.REPO_OWNER}/${github.REPO_NAME}/contents/${fileName}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `token ${apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: `Add ${fileName}`,
            content: btoa(content), // Base64 encode
            branch: github.BRANCH,
            sha, // Include SHA if updating existing file
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`GitHub API error: ${errorData.message}`);
      }

      const result = await response.json();
      return `https://raw.githubusercontent.com/${github.REPO_OWNER}/${github.REPO_NAME}/${github.BRANCH}/${fileName}`;
    } catch (error) {
      console.error('Failed to upload to GitHub:', error);
      throw new Error('GitHub upload failed');
    }
  },

  // Download file from GitHub repository
  downloadFile: async (fileName: string): Promise<string> => {
    try {
      const response = await fetch(
        `https://raw.githubusercontent.com/${github.REPO_OWNER}/${github.REPO_NAME}/${github.BRANCH}/${fileName}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.text();
    } catch (error) {
      console.error('Failed to download from GitHub:', error);
      throw new Error('GitHub download failed');
    }
  },
};

// Unified storage interface
export const storage = {
  // Upload AgentCard
  uploadAgentCard: async (card: AgentCard): Promise<string> => {
    const fileName = `agents/${card.address.toLowerCase()}.json`;
    const content = JSON.stringify(card, null, 2);

    // Try GitHub first, fallback to IPFS
    try {
      return await github.uploadFile(fileName, content);
    } catch (error) {
      console.warn('GitHub upload failed, falling back to IPFS:', error);
      return await ipfs.uploadJSON(card);
    }
  },

  // Download AgentCard
  downloadAgentCard: async (uri: string): Promise<AgentCard> => {
    if (uri.startsWith('ipfs://')) {
      return await ipfs.downloadJSON<AgentCard>(uri);
    } else if (uri.includes('githubusercontent.com') || uri.includes('raw.githubusercontent.com')) {
      const fileName = uri.split('/').pop() || '';
      const content = await github.downloadFile(`agents/${fileName}`);
      return JSON.parse(content);
    } else {
      throw new Error('Unsupported URI format');
    }
  },

  // Upload Receipt
  uploadReceipt: async (receipt: Receipt): Promise<string> => {
    const fileName = `receipts/bounty-${receipt.bountyId}/${receipt.agentAddress.toLowerCase()}-${receipt.timestamp}.json`;
    const content = JSON.stringify(receipt, null, 2);

    // Try GitHub first, fallback to IPFS
    try {
      return await github.uploadFile(fileName, content);
    } catch (error) {
      console.warn('GitHub upload failed, falling back to IPFS:', error);
      return await ipfs.uploadJSON(receipt);
    }
  },

  // Download Receipt
  downloadReceipt: async (uri: string): Promise<Receipt> => {
    if (uri.startsWith('ipfs://')) {
      return await ipfs.downloadJSON<Receipt>(uri);
    } else if (uri.includes('githubusercontent.com') || uri.includes('raw.githubusercontent.com')) {
      const pathParts = uri.split('/');
      const fileName = pathParts.slice(-2).join('/'); // Get receipts/bounty-X/filename.json
      const content = await github.downloadFile(fileName);
      return JSON.parse(content);
    } else {
      throw new Error('Unsupported URI format');
    }
  },
};

export default storage;

