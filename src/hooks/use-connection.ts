import { useEffect, useState } from 'react';

export function useConnection() {
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const checkConnection = async () => {
            try {
                await fetch('/api/postgres/check');
            } catch (error) {
                console.error('Connection check error:', error);
            } finally {
                if (isMounted) {
                    setIsChecking(false);
                }
            }
        };

        checkConnection().then();

        return () => {
            isMounted = false;
        };
    }, []);

    return { isChecking };
}