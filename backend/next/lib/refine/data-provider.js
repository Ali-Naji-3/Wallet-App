import apiClient from '../api/client';
import { ENDPOINTS } from '../api/endpoints';

export const dataProvider = {
  getList: async ({ resource, pagination, filters, sorters, meta }) => {
    const { current = 1, pageSize = 10 } = pagination || {};
    
    // Map resource to API endpoint
    let url = '';
    switch (resource) {
      case 'users':
        url = ENDPOINTS.ADMIN_USERS.LIST;
        break;
      case 'transactions':
        url = ENDPOINTS.ADMIN_TRANSACTIONS.LIST;
        break;
      default:
        url = `/api/admin/${resource}`;
    }

    // Build query params
    const params = {
      page: current,
      limit: pageSize,
    };

    // Add filters
    if (filters) {
      filters.forEach((filter) => {
        if ('field' in filter) {
          params[filter.field] = filter.value;
        }
      });
    }

    // Add search
    if (meta?.search) {
      params.search = meta.search;
    }

    // Add sorting
    if (sorters && sorters.length > 0) {
      params.sortBy = sorters[0].field;
      params.sortOrder = sorters[0].order;
    }

    const { data } = await apiClient.get(url, { params });

    return {
      data: data.users || data.transactions || data.data || [],
      total: data.total || data.pagination?.total || 0,
    };
  },

  getOne: async ({ resource, id }) => {
    let url = '';
    switch (resource) {
      case 'users':
        url = ENDPOINTS.ADMIN_USERS.GET(Number(id));
        break;
      case 'transactions':
        url = ENDPOINTS.ADMIN_TRANSACTIONS.GET(Number(id));
        break;
      default:
        url = `/api/admin/${resource}/${id}`;
    }

    const { data } = await apiClient.get(url);
    return {
      data: data.user || data.transaction || data.data || data,
    };
  },

  create: async ({ resource, variables }) => {
    let url = '';
    switch (resource) {
      case 'users':
        url = ENDPOINTS.ADMIN_USERS.CREATE;
        break;
      default:
        url = `/api/admin/${resource}`;
    }

    const { data } = await apiClient.post(url, variables);
    return {
      data: data.user || data.data || data,
    };
  },

  update: async ({ resource, id, variables }) => {
    let url = '';
    switch (resource) {
      case 'users':
        url = ENDPOINTS.ADMIN_USERS.UPDATE(Number(id));
        break;
      default:
        url = `/api/admin/${resource}/${id}`;
    }

    const { data } = await apiClient.put(url, variables);
    return {
      data: data.user || data.data || data,
    };
  },

  deleteOne: async ({ resource, id }) => {
    let url = '';
    switch (resource) {
      case 'users':
        url = ENDPOINTS.ADMIN_USERS.DELETE(Number(id));
        break;
      default:
        url = `/api/admin/${resource}/${id}`;
    }

    const { data } = await apiClient.delete(url);
    return {
      data: data.user || data.data || data,
    };
  },

  getMany: async ({ resource, ids }) => {
    const promises = ids.map((id) =>
      dataProvider.getOne({ resource, id, meta: {} })
    );
    const results = await Promise.all(promises);
    return {
      data: results.map((result) => result.data),
    };
  },

  getApiUrl: () => {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  },

  custom: async ({ url, method, filters, sorters, payload, query, headers }) => {
    const { data } = await apiClient.request({
      url,
      method,
      data: payload,
      params: query,
      headers,
    });

    return { data };
  },
};

