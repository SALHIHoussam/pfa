import { useEffect, useState } from 'react';
import { fetchCeremonies } from '../api/ceremonies';

export default function useCeremonies() {
  const [ceremonies, setCeremonies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchCeremonies();
        setCeremonies(res.data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return { ceremonies, loading };
}