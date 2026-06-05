import { QueryClient } from '@tanstack/react-query';


export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 1,
			staleTime: 60 * 1000,        // 1 dakika — aynı veriyi tekrar çekme
			gcTime: 5 * 60 * 1000,       // 5 dakika — cache'de tut
		},
	},
});