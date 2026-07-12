// import { useEffect, useState } from "react";

// export default function useCountdownTimer(initialTime: number) {
//   const [timeRemaining, setTimeRemaining] = useState(initialTime);

//   useEffect(() => {
//     const intervalId = setInterval(() => {
//       setTimeRemaining((prevTime: number) => {
//         const newTime = prevTime - 1;
//         return newTime >= 0 ? newTime : 0;
//       });
//     }, 1000);

//     return () => clearInterval(intervalId);
//   }, []);

//   const hours = Math.floor(timeRemaining / 3600);
//   const minutes = Math.floor((timeRemaining % 3600) / 60);
//   const seconds = Math.floor(timeRemaining % 60);

//   return { hours, minutes, seconds, timeRemaining };
// }
