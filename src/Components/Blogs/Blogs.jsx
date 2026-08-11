import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { blogData } from "./BlogData.js";
import { reveal, revealStagger } from "../../animation/ScrollAnimation.js";

const Blogs = () => {
  useEffect(() => {
    reveal(".reveal");
    revealStagger(".stagger-card");
  }, []);

  return (
    <section className="py-20 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold reveal text-blue-800 mb-4 uppercase tracking-tight">
            Manufacturing Insights Blogs
          </h2>
          <div className="h-1 w-20 bg-blue-800 mx-auto rounded-full reveal"></div>
          <p className="text-gray-600 mt-4 max-w-2xl mx-auto reveal">
            Stay updated with the latest trends in CNC machining, VMC
            technology, and industrial press operations.
          </p>
        </div>

        {/* Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 stagger-card">
          {blogData.map((blog) => (
            <div
              key={blog.id}
              className="group bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              {/* Image Container */}
              <div className="relative overflow-hidden h-52 reveal">
                <img
                  src={blog.image}
                  alt={blog.title}
                  className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute reveal top-4 left-4 bg-blue-800 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">
                  {blog.category}
                </div>
              </div>

              {/* Content Section */}
              <div className="p-6 ">
                <p className="text-sm text-gray-400 font-medium mb-2 reveal">
                  {blog.date}
                </p>
                <h4 className="text-xl reveal font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-800 transition-colors">
                  {blog.title}
                </h4>
                <p className="text-gray-600 reveal text-sm leading-relaxed mb-6 line-clamp-3">
                  {blog.desc}
                </p>

                {/* Action Link */}
                <Link
                  to={`/blogs/${blog.id}`}
                  className="inline-flex items-center text-sm font-bold text-blue-800 hover:text-blue-800 transition-colors"
                >
                  READ ARTICLE
                  <svg
                    xmlns="http://www.w3.org"
                    className="h-4 w-4 ml-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Blogs;
