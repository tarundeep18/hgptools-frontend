import React, { useState, useEffect } from "react";
import BrassImg from "../../assets/brass-terminals.jpg";
import { Link, useLocation } from "react-router-dom";
import custumComponent from "../../assets/Custum.png";
import allow from "../../assets/fotor_2026-03-12_18-33-56.png";
import allow2 from "../../assets/fotor_2026-03-12_18-42-03.png";
import allow3 from "../../assets/allow.png";
import { reveal, revealStagger } from "../../animation/ScrollAnimation";
import StampingImg from "../../assets/stamping.jpg";

const ProductSection = () => {
  const location = useLocation();

  useEffect(() => {
    reveal(".reveal");
    revealStagger(".stagger-card");
  }, []);

  const isProductsPage = location.pathname === "/products";

  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const productsPerPage = 10;

  // Example API fetch (replace with your API)
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // const res = await axios.get("/api/products");
        // setProducts(res.data);

        // temporary data
        setProducts([
          {
            title: "Chain wheel",
            category: "Iron/MS Components",
            desc: "This heavy-duty rear drum and sprocket assembly is a dual-purpose component designed for classic motorcycle restorations and repairs",
            image: allow3,
          },

          {
            title: "Clutch Plate Assembly",
            category: "Pulling Components",
            desc: "Manufactured from high-durability materials like stainless steel or mild steel to withstand continuous industrial use",
            image: allow,
          },
          {
            title: "Custom components",
            category: "Misc Metal",
            desc: "user-defined, reusable, and customizable UI elements or structural parts created to meet specific project needs when default options are insufficient",
            image: custumComponent,
          },
          {
            title: "Precision Stamping",
            category: "Misc Metal",
            desc: "High-accuracy metal stamping solutions for electrical and electronic components.",
            image: StampingImg,
          },
          {
            title: "Brass Terminals",
            category: "Lugs",
            desc: "Durable and conductive brass terminals manufactured using CNC machines.",
            image: BrassImg,
          },
          {
            title: "Bus Bars",
            category: "Bus Bar for PCB",
            desc: "Custom-designed copper and aluminum bus bars for power distribution systems.",
            image: "https://www.trade4asia.com/MultiImage/bus-03.png",
          },
          {
            title: "Electrical Enclosures",
            category: "SS Cap",
            desc: "Precision-engineered enclosures ensuring safety and reliability of electronics.",
            image:
              "https://tiimg.tistatic.com/fp/1/004/886/electrical-control-panel-enclosures-068.jpg",
          },
          {
            title: "Machined Parts",
            category: "Iron/MS Components",
            desc: "High-tolerance CNC & VNC machined parts.",
            image: "https://5.imimg.com/data5/TD/EB/MY-102356/cnc-500x500.jpg",
          },
          {
            title: "Custom Components",
            category: "Misc Metal",
            desc: "Bespoke solutions tailored to your needs.",
            image:
              "https://mssinternational.com/Website-content/Page%20content/Articles/Resources/bespoke-assemblies/Assembly-selection.jpg",
          },
        ]);
      } catch (error) {
        console.error(error);
      }
    };

    fetchProducts();
  }, []);

  // Pagination logic
  const indexOfLast = currentPage * productsPerPage;
  const indexOfFirst = indexOfLast - productsPerPage;

  const currentProducts = products.slice(indexOfFirst, indexOfLast);

  const displayProducts = isProductsPage
    ? currentProducts
    : products.slice(0, 6);

  const totalPages = Math.ceil(products.length / productsPerPage);

  return (
    <section className="relative py-24 overflow-hidden bg-gradient-to-b from-slate-950 to-slate-900 text-slate-200 min-h-screen">
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/50 to-slate-950" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 reveal">
        <div className="text-center mb-16">
          <span className="text-sm font-semibold text-blue-500 uppercase tracking-wider">
            Our Portfolio
          </span>

          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Precision <span className="text-blue-500">Components</span>
          </h2>

          <p className="text-lg text-slate-400 max-w-3xl mx-auto">
            High-quality electrical and electronic parts manufactured with
            consistent excellence and performance-driven design.
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid stagger-card grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 revealStagger">
          {displayProducts.map((product, idx) => (
            <div
              key={idx}
              className="group relative bg-gradient-to-b from-slate-900/90 to-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-600 transition-all duration-500 hover:-translate-y-2"
            >
              <div className="h-56 overflow-hidden relative">
                {/* Neutral Glassmorphism Badge */}
                <div className="absolute top-4 left-4 z-10">
                  <span className="px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] font-medium bg-black/40 text-slate-200 border border-white/10 rounded-md backdrop-blur-xl">
                    {product.category}
                  </span>
                </div>

                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                />
              </div>

              <div className="p-6">
                {/* Subtle Category Heading */}
                <span className="block text-[11px] text-slate-500 font-semibold uppercase tracking-widest mb-1">
                  {product.category}
                </span>

                <h3 className="text-xl font-bold text-white mb-3">
                  {product.title}
                </h3>

                <p className="text-slate-400 text-sm leading-relaxed mb-6 line-clamp-2">
                  {product.desc}
                </p>

                {/* Separator Line */}
                <div className="w-full h-[1px] bg-slate-800 mb-4"></div>

                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs uppercase tracking-tight">
                    Industrial Grade
                  </span>
                  <span className="text-xs italic">Spec: Std</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All Button (Only on Home) */}
        {!isProductsPage && (
          <div className="text-center mt-16">
            <Link to="/products">
              <button className="group px-8 py-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500 text-white font-semibold rounded-xl transition-all duration-300 inline-flex items-center gap-2">
                <span>View More</span>
              </button>
            </Link>
          </div>
        )}

        {/* Pagination (Only on Products Page) */}
        {isProductsPage && totalPages > 1 && (
          <div className="flex justify-center mt-16 gap-3">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-4 py-2 rounded-lg border ${
                  currentPage === i + 1
                    ? "bg-cyan-500 text-white border-cyan-500"
                    : "bg-slate-800 text-slate-300 border-slate-700"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductSection;
