// API URL - Lấy tất cả sản phẩm (tối đa 250)
const API_URL = "https://api.escuelajs.co/api/v1/products?offset=0&limit=250";

// DOM Elements
const loadingSpinner = document.getElementById("loadingSpinner");
const tableContainer = document.getElementById("tableContainer");
const errorAlert = document.getElementById("errorAlert");
const errorMessage = document.getElementById("errorMessage");
const productsBody = document.getElementById("productsBody");
const searchContainer = document.getElementById("searchContainer");
const searchInput = document.getElementById("searchInput");
const searchResultCount = document.getElementById("searchResultCount");
const itemsPerPageSelect = document.getElementById("itemsPerPage");
const paginationContainer = document.getElementById("pagination");
const currentPageSpan = document.getElementById("currentPage");
const totalPagesSpan = document.getElementById("totalPages");
const totalItemsSpan = document.getElementById("totalItems");
const exportBtn = document.getElementById("exportBtn");

// Store all products for filtering
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
let itemsPerPage = 10;
let sortField = null;
let sortOrder = "asc"; // 'asc' or 'desc'
let currentEditingProduct = null;
let productModal = null;

// Fetch products from API
async function fetchProducts() {
  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    allProducts = await response.json();

    // Hide loading spinner
    loadingSpinner.style.display = "none";

    // Show search container
    searchContainer.style.display = "block";

    // Display products
    displayProducts(allProducts);
  } catch (error) {
    console.error("Error fetching products:", error);
    loadingSpinner.style.display = "none";
    showError(`Không thể tải dữ liệu: ${error.message}`);
  }
}

// Display products in table
function displayProducts(products) {
  // Clear existing rows
  productsBody.innerHTML = "";

  // Update filtered products
  filteredProducts = products;
  currentPage = 1;

  // Check if products array is empty
  if (products.length === 0) {
    productsBody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-4">
          <p class="text-muted mb-0">Không tìm thấy sản phẩm nào.</p>
        </td>
      </tr>
    `;
    searchResultCount.textContent = "0 kết quả";
    paginationContainer.innerHTML = "";
    totalItemsSpan.textContent = "0";
    totalPagesSpan.textContent = "0";
    return;
  }

  // Update search result count and totals
  searchResultCount.textContent = `${products.length} kết quả`;
  totalItemsSpan.textContent = products.length;

  // Display current page
  displayPage(currentPage);
}

// Show error message
function showError(message) {
  errorMessage.textContent = message;
  errorAlert.style.display = "block";
  tableContainer.style.display = "none";
}

// Display products for current page
function displayPage(pageNum) {
  currentPage = pageNum;

  // Calculate pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (pageNum - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageProducts = filteredProducts.slice(startIndex, endIndex);

  // Clear existing rows
  productsBody.innerHTML = "";

  // Add rows to table
  pageProducts.forEach((product) => {
    const row = document.createElement("tr");

    // Get product image (handle cases where images might be array or string)
    let imageUrl = "";
    if (product.images && product.images.length > 0) {
      imageUrl = product.images[0];
      // Remove quotes if present
      imageUrl = imageUrl.replace(/['"]/g, "");
    }

    // Get category name
    const categoryName = product.category?.name || "N/A";

    // Get description or default text
    const description = product.description || "Không có mô tả";

    row.innerHTML = `
            <td class="text-center id-column">${product.id}</td>
            <td>
                <div class="product-name" title="${product.title}">
                    ${product.title}
                </div>
            </td>
            <td class="text-center">
                <span class="price-badge">
                    $${product.price.toFixed(2)}
                </span>
            </td>
            <td>
                <span class="category-badge">
                    ${categoryName}
                </span>
            </td>
            <td class="text-center">
                ${
                  imageUrl
                    ? `
                    <a href="${imageUrl}" target="_blank" title="Xem ảnh">
                        <img src="${imageUrl}" alt="${product.title}" class="product-image" onerror="this.src='https://via.placeholder.com/150?text=No+Image'">
                    </a>
                `
                    : `
                    <img src="https://via.placeholder.com/150?text=No+Image" alt="No image" class="product-image">
                `
                }
            </td>
        `;

    // Set data attribute with description for tooltip
    row.setAttribute("data-description", description);
    row.setAttribute("data-product-id", product.id);
    row.classList.add("product-row");

    // Add hover event to show description
    row.addEventListener("mouseenter", (e) =>
      showDescription(e, product.id, description),
    );
    row.addEventListener("mouseleave", hideDescription);

    // Add click event to show modal
    row.addEventListener("click", () => {
      showProductModal(product);
    });

    productsBody.appendChild(row);
  });

  // Update pagination info
  currentPageSpan.textContent = pageNum;
  totalPagesSpan.textContent = totalPages;

  // Generate pagination buttons
  generatePaginationButtons(totalPages, pageNum);

  // Show table container
  tableContainer.style.display = "block";
}

// Generate pagination buttons
function generatePaginationButtons(totalPages, currentPage) {
  paginationContainer.innerHTML = "";

  // Previous button
  const prevLi = document.createElement("li");
  prevLi.className = `page-item ${currentPage === 1 ? "disabled" : ""}`;
  prevLi.innerHTML = `<a class="page-link" href="#" onclick="goToPage(${currentPage - 1}); return false;">← Trước</a>`;
  paginationContainer.appendChild(prevLi);

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    // Show first, last, and 2 pages around current page
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      const pageLi = document.createElement("li");
      pageLi.className = `page-item ${i === currentPage ? "active" : ""}`;
      pageLi.innerHTML = `<a class="page-link" href="#" onclick="goToPage(${i}); return false;">${i}</a>`;
      paginationContainer.appendChild(pageLi);
    } else if (
      (i === currentPage - 2 && currentPage > 3) ||
      (i === currentPage + 2 && currentPage < totalPages - 2)
    ) {
      const dotsLi = document.createElement("li");
      dotsLi.className = "page-item disabled";
      dotsLi.innerHTML = `<span class="page-link">...</span>`;
      paginationContainer.appendChild(dotsLi);
    }
  }

  // Next button
  const nextLi = document.createElement("li");
  nextLi.className = `page-item ${currentPage === totalPages ? "disabled" : ""}`;
  nextLi.innerHTML = `<a class="page-link" href="#" onclick="goToPage(${currentPage + 1}); return false;">Tiếp →</a>`;
  paginationContainer.appendChild(nextLi);
}

// Go to specific page
function goToPage(pageNum) {
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  if (pageNum >= 1 && pageNum <= totalPages) {
    displayPage(pageNum);
    // Scroll to top of table
    tableContainer.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// Show description tooltip on hover
function showDescription(event, productId, description) {
  const row = event.currentTarget;
  const existingTooltip = document.getElementById(`tooltip-${productId}`);

  if (existingTooltip) {
    existingTooltip.remove();
  }

  const tooltip = document.createElement("div");
  tooltip.id = `tooltip-${productId}`;
  tooltip.className = "description-tooltip";
  tooltip.innerHTML = `
    <div class="tooltip-title">Mô tả sản phẩm</div>
    <div class="tooltip-content">${description}</div>
  `;

  document.body.appendChild(tooltip);

  // Position tooltip
  const rect = row.getBoundingClientRect();
  tooltip.style.top = rect.bottom + window.scrollY + 5 + "px";
  tooltip.style.left = rect.left + window.scrollX + "px";
  tooltip.style.width = rect.width + "px";

  // Add show class for animation
  setTimeout(() => tooltip.classList.add("show"), 10);
}

// Hide description tooltip
function hideDescription(event) {
  const row = event.currentTarget;
  const productId = row.getAttribute("data-product-id");
  const tooltip = document.getElementById(`tooltip-${productId}`);

  if (tooltip) {
    tooltip.classList.remove("show");
    setTimeout(() => tooltip.remove(), 300);
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  fetchProducts();

  // Add search event listener
  searchInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();

    if (searchTerm === "") {
      // Show all products if search is empty
      displayProducts(allProducts);
    } else {
      // Filter products by title
      const filtered = allProducts.filter((product) =>
        product.title.toLowerCase().includes(searchTerm),
      );
      displayProducts(filtered);
    }
  });

  // Add items per page change listener
  itemsPerPageSelect.addEventListener("change", (e) => {
    itemsPerPage = parseInt(e.target.value);
    currentPage = 1;
    displayPage(1);
  });

  // Add sort header listeners
  const sortHeaders = document.querySelectorAll(".sortable-header");
  sortHeaders.forEach((header) => {
    header.addEventListener("click", () => {
      const field = header.getAttribute("data-sort");
      handleSort(field, header);
    });
  });

  // Add export button listener
  exportBtn.addEventListener("click", exportToCSV);
});

// Handle sorting
function handleSort(field, headerElement) {
  // Toggle sort order
  if (sortField === field) {
    sortOrder = sortOrder === "asc" ? "desc" : "asc";
  } else {
    sortField = field;
    sortOrder = "asc";
  }

  // Update sort icons
  const allHeaders = document.querySelectorAll(".sortable-header");
  allHeaders.forEach((h) => {
    const icon = h.querySelector(".sort-icon");
    if (h.getAttribute("data-sort") === field) {
      icon.className = `sort-icon fas ${
        sortOrder === "asc"
          ? "fa-arrow-up sort-active"
          : "fa-arrow-down sort-active"
      }`;
    } else {
      icon.className = "sort-icon fas fa-arrows-alt-v";
    }
  });

  // Sort the filtered products
  const sorted = [...filteredProducts].sort((a, b) => {
    let aVal, bVal;

    if (field === "title") {
      aVal = a.title.toLowerCase();
      bVal = b.title.toLowerCase();
    } else if (field === "price") {
      aVal = a.price;
      bVal = b.price;
    }

    if (sortOrder === "asc") {
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    } else {
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
    }
  });

  filteredProducts = sorted;
  currentPage = 1;
  displayPage(1);
}

// Export to CSV
function exportToCSV() {
  if (filteredProducts.length === 0) {
    alert("Không có dữ liệu để export!");
    return;
  }

  // Prepare CSV headers
  const headers = ["ID", "Tên Sản Phẩm", "Giá", "Danh Mục", "Mô Tả"];
  const csv = [];

  // Add header row
  csv.push(headers.map((h) => `"${h}"`).join(","));

  // Add data rows
  filteredProducts.forEach((product) => {
    const row = [
      product.id,
      `"${product.title.replace(/"/g, '""')}"`, // Escape quotes
      product.price.toFixed(2),
      `"${(product.category?.name || "N/A").replace(/"/g, '""')}"`,
      `"${(product.description || "").replace(/"/g, '""').substring(0, 100)}"`, // First 100 chars
    ];
    csv.push(row.join(","));
  });

  // Create CSV content
  const csvContent = csv.join("\n");

  // Create blob and download
  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  // Get current date for filename
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "");

  link.setAttribute("href", url);
  link.setAttribute("download", `products_${dateStr}_${timeStr}.csv`);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Show product detail modal
function showProductModal(product) {
  currentEditingProduct = { ...product };

  // Initialize modal on first use
  if (!productModal) {
    productModal = new bootstrap.Modal(
      document.getElementById("productModal"),
      {
        backdrop: "static",
        keyboard: false,
      },
    );
  }

  // Set modal content
  document.getElementById("modalProductId").textContent = product.id;
  document.getElementById("modalProductTitle").value = product.title;
  document.getElementById("modalProductPrice").value = product.price.toFixed(2);
  document.getElementById("modalProductCategory").textContent =
    product.category?.name || "N/A";
  document.getElementById("modalProductDescription").textContent =
    product.description || "Không có mô tả";

  // Set image
  let imageUrl = "";
  if (product.images && product.images.length > 0) {
    imageUrl = product.images[0].replace(/['"]/g, "");
  }
  const img = document.getElementById("modalProductImage");
  img.src = imageUrl || "https://via.placeholder.com/300?text=No+Image";

  // Reset edit mode
  cancelEditMode();

  // Show modal
  productModal.show();
}

// Enable edit mode
function enableEditMode() {
  document.getElementById("modalProductTitle").disabled = false;
  document.getElementById("modalProductPrice").disabled = false;
  document.getElementById("editProductBtn").style.display = "none";
  document.getElementById("saveProductBtn").style.display = "inline-block";
  document.getElementById("cancelEditBtn").style.display = "inline-block";
}

// Cancel edit mode
function cancelEditMode() {
  document.getElementById("modalProductTitle").disabled = true;
  document.getElementById("modalProductPrice").disabled = true;
  document.getElementById("modalProductTitle").value =
    currentEditingProduct.title;
  document.getElementById("modalProductPrice").value =
    currentEditingProduct.price.toFixed(2);
  document.getElementById("editProductBtn").style.display = "inline-block";
  document.getElementById("saveProductBtn").style.display = "none";
  document.getElementById("cancelEditBtn").style.display = "none";
}

// Save product changes
async function saveProductChanges() {
  const newTitle = document.getElementById("modalProductTitle").value.trim();
  const newPrice = parseFloat(
    document.getElementById("modalProductPrice").value,
  );

  if (!newTitle) {
    alert("Tên sản phẩm không được để trống!");
    return;
  }

  if (isNaN(newPrice) || newPrice < 0) {
    alert("Giá phải là số dương!");
    return;
  }

  // Show loading
  const saveBtn = document.getElementById("saveProductBtn");
  const originalText = saveBtn.innerHTML;
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang lưu...';

  try {
    // Call API to update product
    const response = await fetch(
      `https://api.escuelajs.co/api/v1/products/${currentEditingProduct.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newTitle,
          price: newPrice,
          description: currentEditingProduct.description,
          categoryId: currentEditingProduct.category?.id,
          images: currentEditingProduct.images,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const updatedProduct = await response.json();

    // Update local data
    currentEditingProduct = { ...updatedProduct };
    const productIndex = allProducts.findIndex(
      (p) => p.id === currentEditingProduct.id,
    );
    if (productIndex !== -1) {
      allProducts[productIndex] = { ...updatedProduct };
      filteredProducts = filteredProducts.map((p) =>
        p.id === currentEditingProduct.id ? { ...updatedProduct } : p,
      );
    }

    // Refresh the current page
    displayPage(currentPage);

    // Show success message
    alert("Cập nhật sản phẩm thành công!");

    // Cancel edit mode
    cancelEditMode();

    // Reload modal with new data
    showProductModal(currentEditingProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    alert(`Lỗi cập nhật: ${error.message}`);
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = originalText;
  }
}

// Create new product
async function createNewProduct() {
  // Get form values
  const title = document.getElementById("newProductTitle").value.trim();
  const price = parseFloat(document.getElementById("newProductPrice").value);
  const description = document
    .getElementById("newProductDescription")
    .value.trim();
  const categoryId = parseInt(
    document.getElementById("newProductCategory").value,
  );
  const imageUrl = document.getElementById("newProductImages").value.trim();

  // Validation
  if (!title) {
    alert("Tên sản phẩm không được để trống!");
    return;
  }

  if (isNaN(price) || price < 0) {
    alert("Giá phải là số dương!");
    return;
  }

  if (isNaN(categoryId) || categoryId < 1) {
    alert("Danh mục ID phải là số dương!");
    return;
  }

  if (!imageUrl) {
    alert("URL hình ảnh không được để trống!");
    return;
  }

  // Show loading
  const createBtn = document.getElementById("createProductBtn");
  const originalText = createBtn.innerHTML;
  createBtn.disabled = true;
  createBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang tạo...';

  try {
    // Call API to create product
    const response = await fetch("https://api.escuelajs.co/api/v1/products/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: title,
        price: price,
        description: description || "Không có mô tả",
        categoryId: categoryId,
        images: [imageUrl],
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const newProduct = await response.json();

    // Add to local data
    allProducts.unshift(newProduct); // Add to beginning
    filteredProducts = [...allProducts];

    // Refresh the display
    currentPage = 1;
    displayProducts(allProducts);

    // Show success message
    alert(`Tạo sản phẩm thành công! ID: ${newProduct.id}`);

    // Close modal and reset form
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("createProductModal"),
    );
    modal.hide();
    document.getElementById("createProductForm").reset();
  } catch (error) {
    console.error("Error creating product:", error);
    alert(`Lỗi tạo sản phẩm: ${error.message}`);
  } finally {
    createBtn.disabled = false;
    createBtn.innerHTML = originalText;
  }
}
