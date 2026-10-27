"use client"

import { useQuery } from "@tanstack/react-query";
import { homePageProducts } from "../api/customer/action";
import PageLoading from "@/components/page-loading";

export default function Dashboard(){

  const { data : products= [],isLoading , isError, error } = useQuery({
    queryKey : ["prods"],
    queryFn: async() => {
      const res = await homePageProducts();
      if(!res.success || !res.data){
        throw new Error(res.message || "Failed to load");
      }
      return res.data;
    },
    staleTime : 60*1000
  });

  if (isLoading) return <PageLoading />;
  if (isError) return <div>Error: {error?.message}</div>;

  return (
    <div className="p-4 space-y-2">
      {products.map((e) => (
        <div key={e.id} className="p-3 border rounded">
          <span>{e.name} : ${e.price}</span>
        </div>
      ))}
    </div>
  );
}