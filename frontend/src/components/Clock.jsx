import { useState, useEffect } from 'react';

export default function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
      {time.toLocaleTimeString()}
    </span>
  );
}
