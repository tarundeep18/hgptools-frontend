import React, { useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { blogData } from "./BlogData.js"; // Ensure blogData is exported from your Blogs file
import { reveal, revealStagger } from "../../animation/ScrollAnimation.js";

const BlogDetails = () => {


  useEffect(() => {
      reveal(".reveal");
      revealStagger(".stagger-card");
    }, []);

  const { id } = useParams();
  const navigate = useNavigate();

  // Find the specific blog post
  const blog = blogData.find((b) => b.id === parseInt(id));

  // Scroll to top on load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // Handle case where blog isn't found
  if (!blog) {
    return (
      <div className="py-24 text-center">
        <h2 className="text-2xl font-bold">Blog post not found</h2>
        <Link to="/" className="text-blue-600 underline mt-4 inline-block">
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <article className="bg-white min-h-screen">
      {/* Hero Section */}
      <div className="w-full h-[400px] relative ">
        <img
          src={blog.image}
          alt={blog.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="max-w-4xl px-4 reveal text-center">
            <span className="bg-blue-600  text-white text-sm font-bold px-4 py-1 rounded-full uppercase tracking-widest">
              {blog.category}
            </span>
            <h1 className="text-3xl reveal md:text-5xl font-extrabold text-white mt-4 leading-tight">
              {blog.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8 pb-8 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="h-12 reveal w-12 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600">
              M
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 reveal">
                Manufacturing Expert
              </p>
              <p className="text-xs text-gray-500 reveal">{blog.date} • 5 min read</p>
            </div>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="text-sm font-semibold text-blue-600 flex items-center hover:gap-2 transition-all"
          >
            ← BACK TO BLOGS
          </button>
        </div>

        {/* Detailed Text */}
        <div className="prose prose-lg max-w-none">
          <p className="text-xl text-gray-600 reveal leading-relaxed mb-8 font-medium italic">
            {blog.desc}
          </p>
          <div className="text-gray-800 leading-8 space-y-6 reveal">
            {/* Using fullDetails from your dummy data */}
            <p>{blog.fullDetails}</p>

            <h3 className="text-2xl font-bold mt-10 mb-4">
              Key Industrial Impact
            </h3>
            <p className="reveal">
              In the modern manufacturing landscape, the implementation of{" "}
              {blog.category} technology has revolutionized production speeds
              and accuracy. Whether you are dealing with high-volume stamping or
              precision toolroom work, staying updated with these advancements
              is non-negotiable for operational efficiency.
            </p>
          </div>
        </div>

        {/* Footer/CTA */}
        <div className="mt-16 p-8 bg-gray-50 rounded-2xl border border-gray-200 flex flex-col md:flex-row items-center justify-between">
          <div>
            <h4 className="text-xl font-bold mb-2 reveal">
              Interested in {blog.category} solutions?
            </h4>
            <p className="text-gray-600 reveal">
              Contact our technical team for a detailed consultation.
            </p>
          </div>
          <button className="mt-6 md:mt-0 bg-gray-900 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-600 transition-colors">
            <Link to="/quote" className="reveal">Get a Quote</Link>
          </button>
        </div>
      </div>
    </article>
  );
};

export default BlogDetails;
