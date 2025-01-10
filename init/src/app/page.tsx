"use client";

import { Button } from "@/components/ui/button";
import { increment } from "@/lib/features/counter";
import { useGetDataQuery } from "@/lib/features/services/apiSlices/sample.api";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";

export default function Home() {
  const { value } = useAppSelector((state) => state.counter);
  const dispatch = useAppDispatch();
  const { data } = useGetDataQuery({});

  const handleBtnClick = () => {
    dispatch(increment());
  };

  return (
    <main className="flex h-screen flex-col  justify-center gap-3 items-center  p-24">
      <div>{value}</div>
      <div>{JSON.stringify(data)}</div>
      <Button
        onClick={handleBtnClick}
        className="rounded-2xl px-10 cursor:pointer"
      >
        Increment
      </Button>
    </main>
  );
}
