import axios from "axios";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { MdDelete, MdModeEdit } from "react-icons/md";
import { IoMdEye } from "react-icons/io";
import { useOutletContext } from "react-router-dom";

const BlogData = () => {
  const { darkMode } = useOutletContext();
  const [loading, setLoading] = useState(false);
  const [modalMode, setModalMode] = useState(null);
  const [currentBlog, setCurrentBlog] = useState({});
  const [blogs, setBlogs] = useState([]);
  const [viewBlog, setViewBlog] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // Fetch blogs
  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/blogs`,
        {
          withCredentials: true,
        },
      );
      setBlogs(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch blogs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  // Create blog
  const createBlog = async (blogData) => {
    try {
      const formData = new FormData();
      formData.append("title", blogData.title);
      formData.append("description", blogData.content);
      formData.append("category", blogData.category);
      formData.append("author", blogData.author);
      formData.append("metaDesc", blogData.metaDesc || "");
      formData.append("keywords", blogData.keywords || "");

      if (selectedFile) {
        formData.append("coverImg", selectedFile);
      }

      const response = await axios.post(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/blogs`,
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (response.data.success) {
        toast.success("Blog created successfully!");
        fetchBlogs();
        closeModal();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create blog");
    }
  };

  // Update blog
  const updateBlog = async (blogData) => {
    try {
      const formData = new FormData();
      formData.append("title", blogData.title);
      formData.append("description", blogData.content);
      formData.append("category", blogData.category);
      formData.append("author", blogData.author);
      formData.append("metaDesc", blogData.metaDesc || "");
      formData.append("keywords", blogData.keywords || "");

      if (selectedFile) {
        formData.append("coverImg", selectedFile);
      }

      const response = await axios.put(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/blogs/${blogData._id}`,
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (response.data.success) {
        toast.success("Blog updated successfully!");
        fetchBlogs();
        closeModal();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update blog");
    }
  };

  // Delete blog
  const deleteBlog = async (id) => {
    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/blogs/${id}`,
        {
          withCredentials: true,
        },
      );

      if (response.data.success) {
        toast.success("Blog deleted successfully!");
        fetchBlogs();
        closeModal();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete blog");
    }
  };

  const openModal = (
    mode,
    blog = {
      _id: "",
      title: "",
      author: "",
      category: "Tech",
      content: "",
      metaDesc: "",
      keywords: "",
      coverImg: "",
    },
  ) => {
    setModalMode(mode);
    setCurrentBlog(blog);
    setSelectedFile(null);
  };

  const closeModal = () => {
    setModalMode(null);
    setCurrentBlog({});
    setViewBlog(null);
    setSelectedFile(null);
  };

  const handleDelete = () => {
    if (currentBlog._id) {
      deleteBlog(currentBlog._id);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentBlog({ ...currentBlog, coverImg: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (modalMode === "add") {
      createBlog(currentBlog);
    } else if (modalMode === "edit") {
      updateBlog(currentBlog);
    }
  };

  const openViewModal = (blog) => {
    setViewBlog(blog);
  };

  return (
    <div className="mx-auto my-10 px-5 font-sans">
      <div
        className={`${darkMode ? "bg-gray-900" : "bg-gray-50"} rounded-2xl shadow-sm border border-gray-100 overflow-hidden`}
      >
        <div
          className={`${
            darkMode ? "bg-gray-800" : "bg-white"
          } rounded-xl shadow-sm border border-gray-100 p-6 mb-4`}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1
                className={`text-2xl md:text-3xl font-bold tracking-tight ${
                  darkMode ? "text-blue-500" : "text-blue-800"
                }`}
              >
                Blog Management
              </h1>
              <p
                className={`mt-1 text-sm ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Manage your blog content, drafts, and publishing status.
              </p>
            </div>

            <button
              onClick={() => openModal("add")}
              className="inline-flex items-center gap-2 bg-blue-800 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg shadow-md transition-all active:scale-[0.98]"
            >
              <span className="text-lg">+</span>
              Create New Blog
            </button>
          </div>
        </div>

        <div
          className={`${
            darkMode ? "bg-gray-800" : "bg-white"
          } rounded-xl shadow-sm border border-gray-100 overflow-hidden`}
        >
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className={`${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                  <tr>
                    {["Cover", "Title", "Category", "Keywords", "Actions"].map(
                      (h) => (
                        <th
                          key={h}
                          className={`px-6 py-4 text-left text-xs uppercase font-bold ${
                            darkMode ? "text-gray-300" : "text-gray-500"
                          }`}
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {blogs.length > 0 ? (
                    blogs.map((blog) => (
                      <tr
                        key={blog._id}
                        className={`transition-colors ${
                          darkMode
                            ? "hover:bg-gray-700/40"
                            : "hover:bg-indigo-50/30"
                        }`}
                      >
                        <td className="px-6 py-4">
                          {blog.coverImg ? (
                            <img
                              src={blog.coverImg}
                              alt="cover"
                              className="w-14 h-14 rounded-lg object-cover border border-gray-200 shadow-sm"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs font-semibold border border-gray-200">
                              No Img
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <div
                            className={`font-semibold ${
                              darkMode ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {blog.title}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            By {blog.author}
                          </div>
                        </td>

                        <td
                          className={`px-6 py-4 text-sm font-medium ${
                            darkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          {blog.category}
                        </td>

                        <td className="px-6 py-4">
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100">
                            {blog.keywords || "N/A"}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-sm flex items-center gap-4 h-20">
                          <button
                            onClick={() => openViewModal(blog)}
                            className="text-blue-600 hover:text-blue-800 transition"
                            title="View Details"
                          >
                            <IoMdEye className="text-2xl" />
                          </button>
                          <button
                            onClick={() => openModal("edit", blog)}
                            className="text-indigo-600 hover:text-indigo-900 transition"
                            title="Edit"
                          >
                            <MdModeEdit className="text-2xl" />
                          </button>
                          <button
                            onClick={() => openModal("delete", blog)}
                            className="text-red-500 hover:text-red-700 transition"
                            title="Delete"
                          >
                            <MdDelete className="text-2xl" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-6 py-10 text-center text-gray-500"
                      >
                        No blogs found. Create your first blog!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  Showing <span className="font-medium">1</span> to{" "}
                  <span className="font-medium">{blogs.length}</span> of{" "}
                  <span className="font-medium">{blogs.length}</span> blogs
                </p>
                <div className="flex gap-2">
                  <button className="px-3 py-1 border border-gray-200 rounded text-sm hover:bg-gray-50 disabled:opacity-50">
                    Previous
                  </button>
                  <button className="px-3 py-1 bg-blue-700 text-white rounded text-sm hover:bg-blue-800">
                    1
                  </button>
                  <button className="px-3 py-1 border border-gray-200 rounded text-sm hover:bg-gray-50">
                    2
                  </button>
                  <button className="px-3 py-1 border border-gray-200 rounded text-sm hover:bg-gray-50">
                    3
                  </button>
                  <button className="px-3 py-1 border border-gray-200 rounded text-sm hover:bg-gray-50">
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* View Blog Modal */}
      {viewBlog && (
        <div className="fixed inset-0  bg-black/50 flex justify-center items-center z-50 p-4 transition-all">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Blog Details</h2>
              <button
                onClick={closeModal}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all text-2xl"
              >
                &times;
              </button>
            </div>

            <div className="p-8">
              {viewBlog.coverImg && (
                <div className="mb-8 rounded-xl overflow-hidden">
                  <img
                    src={viewBlog.coverImg}
                    alt={viewBlog.title}
                    className="w-full h-64 object-cover"
                  />
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-500 mb-1">
                    Title
                  </label>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {viewBlog.title}
                  </h1>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-500 mb-1">
                      Author
                    </label>
                    <p className="text-lg text-gray-900">{viewBlog.author}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-500 mb-1">
                      Category
                    </label>
                    <p className="text-lg text-gray-900">{viewBlog.category}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-500 mb-1">
                    Meta Description
                  </label>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                    {viewBlog.metaDesc || "No meta description provided"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-500 mb-1">
                    Keywords
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {viewBlog.keywords ? (
                      viewBlog.keywords.split(",").map((keyword, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {keyword.trim()}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500">No keywords</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-500 mb-1">
                    Content
                  </label>
                  <div className="prose max-w-none bg-gray-50 p-6 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {viewBlog.description}
                    </p>
                  </div>
                </div>

                {viewBlog.createdAt && (
                  <div className="text-sm text-gray-500">
                    Created: {new Date(viewBlog.createdAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-8 py-4 flex justify-end">
              <button
                onClick={closeModal}
                className="px-6 py-2 bg-blue-800 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {modalMode === "delete" && (
        <div className="fixed inset-0  bg-black/50 flex justify-center items-center z-50 p-4 transition-all">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="p-12 text-center">
              <div className="w-24 h-24 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </div>
              <h2 className="text-3xl font-black text-slate-900">
                Wait a second!
              </h2>
              <p className="text-slate-500 mt-3 mb-10 text-lg">
                You're about to delete{" "}
                <span className="font-bold text-slate-800">
                  "{currentBlog.title}"
                </span>
                . This cannot be undone.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={closeModal}
                  className="flex-1 py-4 font-bold text-slate-400 hover:bg-slate-50 rounded-2xl transition-all"
                >
                  Go Back
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 shadow-xl shadow-red-200 transition-all active:scale-95"
                >
                  Delete Forever
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Blog Modal */}
      {(modalMode === "add" || modalMode === "edit") && (
        <div className="fixed inset-0  bg-black/50 flex justify-center items-center z-50 p-4 transition-all">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <form onSubmit={handleSubmit} className="flex flex-col">
              <div className="px-10 py-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    {modalMode === "add" ? "Create New Blog" : "Edit Blog"}
                  </h2>
                  <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mt-1">
                    {modalMode === "add" ? "New Post" : "Update Post"}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  type="button"
                  className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-400 transition-all text-2xl"
                >
                  &times;
                </button>
              </div>

              <div className="p-10 space-y-8">
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
                    Cover Image{" "}
                    {modalMode === "edit" && "(Leave empty to keep current)"}
                  </label>
                  <div className="group relative h-52 w-full border-2 border-dashed border-slate-200 rounded-[2rem] overflow-hidden hover:border-emerald-400 transition-all bg-white shadow-sm">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    {currentBlog.coverImg ? (
                      <img
                        src={currentBlog.coverImg}
                        className="w-full h-full object-cover"
                        alt="preview"
                      />
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <div className="p-4 bg-emerald-50 text-emerald-600 rounded-3xl mb-3">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-8 w-8"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <span className="text-sm font-bold text-slate-600">
                          {modalMode === "add"
                            ? "Drop your cover image here"
                            : "Click to change cover image"}
                        </span>
                        <span className="text-xs text-slate-400 mt-1">
                          PNG, JPG up to 10MB
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-[0.2em] mb-2 pl-1">
                      Article Title *
                    </label>
                    <input
                      required
                      className="w-full bg-white border border-slate-200 p-4 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-semibold text-slate-800"
                      value={currentBlog.title}
                      onChange={(e) =>
                        setCurrentBlog({
                          ...currentBlog,
                          title: e.target.value,
                        })
                      }
                      placeholder="Give your story a name..."
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-[0.2em] mb-2 pl-1">
                      Content *
                    </label>
                    <textarea
                      required
                      rows="4"
                      className="w-full bg-white border border-slate-200 p-4 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium text-slate-700 resize-none"
                      value={currentBlog.content || currentBlog.description}
                      onChange={(e) =>
                        setCurrentBlog({
                          ...currentBlog,
                          content: e.target.value,
                        })
                      }
                      placeholder="What is this article about? Write the main body here..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-[0.2em] mb-2 pl-1">
                        Author *
                      </label>
                      <input
                        required
                        className="w-full bg-white border border-slate-200 p-4 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                        value={currentBlog.author}
                        onChange={(e) =>
                          setCurrentBlog({
                            ...currentBlog,
                            author: e.target.value,
                          })
                        }
                        placeholder="Lead Writer"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-[0.2em] mb-2 pl-1">
                        Category *
                      </label>
                      <select
                        required
                        className="w-full bg-white border border-slate-200 p-4 rounded-2xl appearance-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                        value={currentBlog.category}
                        onChange={(e) =>
                          setCurrentBlog({
                            ...currentBlog,
                            category: e.target.value,
                          })
                        }
                      >
                        <option value="Tech">Technology</option>
                        <option value="Lifestyle">Lifestyle</option>
                        <option value="Business">Business Strategy</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-6 bg-emerald-50/50 rounded-[2rem] border border-emerald-100 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      <h3 className="text-sm font-black text-emerald-900 uppercase tracking-widest">
                        SEO Optimization
                      </h3>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-emerald-700 uppercase mb-1">
                        Meta Description *
                      </label>
                      <input
                        required
                        className="w-full bg-white/80 border border-emerald-100 p-3 rounded-xl focus:bg-white outline-none transition-all text-sm"
                        value={currentBlog.metaDesc || ""}
                        onChange={(e) =>
                          setCurrentBlog({
                            ...currentBlog,
                            metaDesc: e.target.value,
                          })
                        }
                        placeholder="Brief summary for search results..."
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-emerald-700 uppercase mb-1">
                        Focus Keywords *
                      </label>
                      <input
                        required
                        className="w-full bg-white/80 border border-emerald-100 p-3 rounded-xl focus:bg-white outline-none transition-all text-sm"
                        value={currentBlog.keywords || ""}
                        onChange={(e) =>
                          setCurrentBlog({
                            ...currentBlog,
                            keywords: e.target.value,
                          })
                        }
                        placeholder="e.g. React, Tailwind, UI Design"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-10 py-6 border-t border-slate-100 flex gap-4 bg-white sticky bottom-0">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-8 py-4 text-slate-400 font-bold hover:text-slate-600 transition-all hover:bg-slate-50 rounded-2xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 shadow-2xl shadow-slate-300 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {modalMode === "add" ? "Create Blog" : "Update Blog"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogData;
