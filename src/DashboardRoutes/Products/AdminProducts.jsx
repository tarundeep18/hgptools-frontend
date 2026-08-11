import React, { useEffect, useState } from "react";
import {
  X,
  Plus,
  Search,
  Filter,
  Upload,
  Image as ImageIcon,
  Calendar,
  Package,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { IoMdEye } from "react-icons/io";
import { MdDelete, MdEdit } from "react-icons/md";
import axios from "axios";
import toast from "react-hot-toast";

const API = import.meta.env.VITE_REACT_APP_BACKEND_BASEURL;

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  const [form, setForm] = useState({
    title: "",
    desc: "",
    image: null,
    imagePreview: "",
  });

  const [editId, setEditId] = useState(null);

  const openDeleteModal = (product) => {
    setProductToDelete(product);
    setDeleteModalOpen(true);
  };

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);

  // FETCH PRODUCTS
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/products`, {
        withCredentials: true,
      });
      setProducts(res.data.products || []);
      setFilteredProducts(res.data.products || []);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Search functionality
  useEffect(() => {
    const filtered = products.filter(
      (product) =>
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.desc.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setFilteredProducts(filtered);
    setCurrentPage(1);
  }, [searchTerm, products]);

  // FORM INPUT
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm({
        ...form,
        image: file,
        imagePreview: URL.createObjectURL(file),
      });
    }
  };

  // CREATE / UPDATE PRODUCT
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("desc", form.desc);

      if (form.image && typeof form.image !== "string") {
        formData.append("image", form.image);
      }

      if (editId) {
        await axios.put(`${API}/products/${editId}`, formData, {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Product updated successfully");
      } else {
        await axios.post(`${API}/products`, formData, {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Product created successfully");
      }

      setForm({ title: "", desc: "", image: null, imagePreview: "" });
      setEditId(null);
      setIsFormOpen(false);
      fetchProducts();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setFormLoading(false);
    }
  };

  // DELETE PRODUCT
  const deleteProduct = async () => {
    if (!productToDelete) return;

    const id = productToDelete._id;

    setDeleteLoading(id);

    try {
      await axios.delete(`${API}/products/${id}`, {
        withCredentials: true,
      });

      toast.success("Product deleted successfully");

      setProducts((prev) => prev.filter((p) => p._id !== id));

      setDeleteModalOpen(false);
      setProductToDelete(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  // VIEW PRODUCT
  const handleView = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  // EDIT PRODUCT
  const handleEdit = (product) => {
    setForm({
      title: product.title,
      desc: product.desc,
      image: product.image,
      imagePreview: product.image,
    });
    setEditId(product._id);
    setIsFormOpen(true);
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className=" mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* HEADER */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Products</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your product inventory
              </p>
            </div>

            <button
              onClick={() => {
                setEditId(null);
                setForm({ title: "", desc: "", image: null, imagePreview: "" });
                setIsFormOpen(true);
              }}
              className="inline-flex items-center bg-blue-800 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-all"
            >
              <Plus size={18} className="mr-2" />
              Add New Product
            </button>
          </div>

          {/* Search Bar */}
          <div className="mt-6 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search products by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-500">Loading products...</span>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        S.No
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Product
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Description
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Added On
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentItems.length > 0 ? (
                      currentItems.map((product, index) => (
                        <tr
                          key={product._id}
                          className="hover:bg-gray-50 transition-colors duration-150"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {indexOfFirstItem + index + 1}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-12 w-12 rounded-xl overflow-hidden bg-gray-100">
                                {product.image ? (
                                  <img
                                    src={product.image}
                                    alt={product.title}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center">
                                    <ImageIcon className="h-6 w-6 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {product.title}
                                </div>
                                <div className="text-sm text-gray-500">
                                  ID: {product._id.slice(-6)}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate">
                              {product.desc}
                            </div>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(product.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                },
                              )}
                            </div>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => handleView(product)}
                                className="p-2 text-blue-800 hover:bg-blue-50 rounded-xl transition-colors duration-150"
                                title="View"
                              >
                                <IoMdEye className="text-2xl" />
                              </button>

                              <button
                                onClick={() => handleEdit(product)}
                                className="p-2 text-blue-800 hover:bg-green-50 rounded-xl transition-colors duration-150"
                                title="Edit"
                              >
                                <MdEdit className="text-2xl" />
                              </button>

                              <button
                                onClick={() => openDeleteModal(product)}
                                disabled={deleteLoading === product._id}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors duration-150 disabled:opacity-50"
                                title="Delete"
                              >
                                {deleteLoading === product._id ? (
                                  <Loader2 size={18} className="animate-spin" />
                                ) : (
                                  <MdDelete className="text-2xl" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <AlertCircle className="h-12 w-12 text-gray-400 mb-3" />
                            <p className="text-gray-500 text-lg">
                              No products found
                            </p>
                            <p className="text-gray-400 text-sm mt-1">
                              {searchTerm
                                ? "Try adjusting your search"
                                : "Add your first product to get started"}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    Showing <span className="font-medium">1</span> to{" "}
                    <span className="font-medium">{currentItems.length}</span>{" "}
                    of{" "}
                    <span className="font-medium">{currentItems.length}</span>{" "}
                    users
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-6 py-4 flex items-center justify-between border-t border-gray-200">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing{" "}
                        <span className="font-medium">
                          {indexOfFirstItem + 1}
                        </span>{" "}
                        to{" "}
                        <span className="font-medium">
                          {Math.min(indexOfLastItem, filteredProducts.length)}
                        </span>{" "}
                        of{" "}
                        <span className="font-medium">
                          {filteredProducts.length}
                        </span>{" "}
                        results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() =>
                            setCurrentPage((prev) => Math.max(prev - 1, 1))
                          }
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          <span className="sr-only">Previous</span>
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        {[...Array(totalPages)].map((_, i) => (
                          <button
                            key={i + 1}
                            onClick={() => setCurrentPage(i + 1)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === i + 1
                                ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                            }`}
                          >
                            {i + 1}
                          </button>
                        ))}
                        <button
                          onClick={() =>
                            setCurrentPage((prev) =>
                              Math.min(prev + 1, totalPages),
                            )
                          }
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          <span className="sr-only">Next</span>
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* VIEW MODAL */}
      {isModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen bg-black/50 px-4">
            <div
              className="fixed inset-0 transition-opacity"
              onClick={() => setIsModalOpen(false)}
            ></div>

            <div className="inline-block bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="relative">
                {selectedProduct.image ? (
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.title}
                    className="w-full h-64 object-cover"
                  />
                ) : (
                  <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
                    <ImageIcon className="h-16 w-16 text-gray-400" />
                  </div>
                )}
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="px-6 py-4">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedProduct.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {selectedProduct.desc}
                </p>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    Added on{" "}
                    {new Date(selectedProduct.createdAt).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      },
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FORM MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen bg-black/50 px-4">
            <div className="inline-block items-center justify-center  bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">
                  {editId ? "Edit Product" : "Add New Product"}
                </h3>
              </div>

              <form onSubmit={handleSubmit} className="px-6 py-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      required
                      placeholder="Enter product title"
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      name="desc"
                      value={form.desc}
                      onChange={handleChange}
                      required
                      rows="4"
                      placeholder="Enter product description"
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Image
                    </label>
                    <div className="mt-1 flex items-center space-x-4">
                      {form.imagePreview && (
                        <div className="flex-shrink-0 h-20 w-20 rounded-xl overflow-hidden bg-gray-100">
                          <img
                            src={form.imagePreview}
                            alt="Preview"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <label className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-center px-4 py-2 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 transition-colors duration-200">
                          <Upload className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-600">
                            {form.imagePreview
                              ? "Change image"
                              : "Upload image"}
                          </span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {formLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        {editId ? "Updating..." : "Creating..."}
                      </>
                    ) : editId ? (
                      "Update Product"
                    ) : (
                      "Create Product"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {deleteModalOpen && productToDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]"
            onClick={() => setDeleteModalOpen(false)}
          />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
              <h3 className="text-xl font-semibold text-slate-800">
                Confirm Deletion
              </h3>

              <button
                onClick={() => setDeleteModalOpen(false)}
                className="p-2 rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-8">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mb-4 mx-auto">
                <span className="text-red-600 text-xl font-bold">!</span>
              </div>

              <div className="text-center space-y-2 mb-8">
                <p className="text-slate-600">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-slate-900">
                    {productToDelete.title}
                  </span>
                  ?
                </p>

                <p className="text-sm text-slate-500">
                  This product will be permanently removed.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  disabled={deleteLoading}
                  className="flex-1 px-4 py-2.5 text-slate-700 bg-white border border-slate-200 rounded-lg font-medium hover:bg-slate-50 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  onClick={deleteProduct}
                  disabled={deleteLoading}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium shadow-sm transition-all disabled:opacity-50"
                >
                  {deleteLoading ? "Deleting..." : "Delete Product"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
