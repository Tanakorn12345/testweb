// components/MenuSection.js
import MenuCard from "./MenuCards";

export default function MenuSection({ title, items , restaurant ,isStoreOpen}) {
 
  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      <h3 className="text-2xl font-bold mb-6">{title}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6">
        {items.map((item) => (
          <MenuCard key={item.id} item={item} restaurant={restaurant} isStoreOpen={isStoreOpen}/>
        ))}
      </div>
    </section>
  );
}