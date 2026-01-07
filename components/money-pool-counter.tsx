"use client";

import CountUp from "react-countup";

export function MoneyPoolCounter({ amount }: { amount: number }) {
  return (
    <CountUp
      start={0}
      end={amount}
      duration={1.6}
      separator=","
      prefix="$"
      decimals={0}
      preserveValue
    />
  );
}
