const express = require("express");
const db = require("../db");

const router = express.Router();

// Only approved products are exposed to customers.
async function getProducts() {
  const [products] = await db.query(`
    SELECT
      p.id,
      p.name,
      p.category,
      p.product_type,
      p.brand,
      p.description,
      COALESCE(v.variant_sale_price, NULLIF(p.price, 0)) AS price,
      COALESCE(
        v.variant_original_price,
        NULLIF(p.original_price, 0),
        NULLIF(p.price, 0),
        v.variant_sale_price
      ) AS original_price,
      CASE
        WHEN COALESCE(
          v.variant_original_price,
          NULLIF(p.original_price, 0),
          NULLIF(p.price, 0),
          v.variant_sale_price
        ) > COALESCE(v.variant_sale_price, NULLIF(p.price, 0))
        AND COALESCE(
          v.variant_original_price,
          NULLIF(p.original_price, 0),
          NULLIF(p.price, 0),
          v.variant_sale_price
        ) > 0
        THEN ROUND(
          (
            COALESCE(
              v.variant_original_price,
              NULLIF(p.original_price, 0),
              NULLIF(p.price, 0),
              v.variant_sale_price
            ) - COALESCE(v.variant_sale_price, NULLIF(p.price, 0))
          ) * 100 /
          COALESCE(
            v.variant_original_price,
            NULLIF(p.original_price, 0),
            NULLIF(p.price, 0),
            v.variant_sale_price
          )
        )
        ELSE COALESCE(p.discount, 0)
      END AS discount,
      COALESCE(v.variant_stock, p.stock) AS stock,
      p.image
    FROM products p
    LEFT JOIN (
      SELECT
        product_id,
        MIN(
          CASE
            WHEN available = 1 AND stock > 0
            THEN COALESCE(NULLIF(discount_price, 0), price)
          END
        ) AS variant_sale_price,
        MIN(
          CASE
            WHEN available = 1 AND stock > 0
            THEN price
          END
        ) AS variant_original_price,
        SUM(
          CASE WHEN available = 1 THEN stock ELSE 0 END
        ) AS variant_stock
      FROM product_variants
      GROUP BY product_id
    ) v ON v.product_id = p.id
    WHERE p.status = 'approved'
      AND COALESCE(v.variant_sale_price, NULLIF(p.price, 0)) > 0
    ORDER BY p.id DESC
    LIMIT 200
  `);

  return products;
}
function formatPrice(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "Price unavailable";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function youtubeLink(query) {
  return (
    "https://www.youtube.com/results?search_query=" +
    encodeURIComponent(query)
  );
}

function answerQuestion(question, products) {
  const q = question.toLowerCase().trim();

  if (!q) {
    return {
      answer: "Please type a question about ShopEase products.",
      products: [],
      videos: [],
    };
  }

  const budgetMatch = q.match(
    /(?:under|below|within|budget|lopu|less than)\s*₹?\s*([\d,]+)|₹\s*([\d,]+)/
  );

  const budget = budgetMatch
    ? Number(
        (budgetMatch[1] || budgetMatch[2]).replace(/,/g, "")
      )
    : null;

  const comparisonWords = [
    "compare",
    "comparison",
    "difference",
    "better than",
    "polch",
    "compare cheyy",
  ];

  const isComparison = comparisonWords.some(
    (word) => q.includes(word)
  );

  const isVideo = [
    "youtube",
    "video",
    "review",
    "tutorial",
    "how to use",
    "unboxing",
    "setup",
  ].some((word) => q.includes(word));

  const isGreeting = [
    "hi",
    "hello",
    "hey",
    "namaste",
    "namaskaram",
  ].includes(q.replace(/[!.?]/g, ""));

  if (isGreeting) {
    return {
      answer:
        "Hi! Welcome to ShopEase 👋 Ask me about products, prices, discounts, stock, comparisons, or recommendations.",
      products: [],
      videos: [],
    };
  }

  const searchableProducts = products.map((product) => ({
    ...product,
    searchable: [
      product.name,
      product.brand,
      product.category,
      product.product_type,
      product.description,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase(),
  }));


  // Handle general requests to browse the product catalogue.
  const normalizedQuestion = q
    .replace(/[!?.,]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const isBrowseAll =
    /^(show|list|display|browse|see|get)\s+(me\s+)?(all\s+)?(available\s+)?(products|items|catalogue|catalog)$/i.test(normalizedQuestion) ||
    /^(all|available)\s+(products|items)$/i.test(normalizedQuestion) ||
    /^(products|items|catalogue|catalog)$/i.test(normalizedQuestion);

  if (isBrowseAll) {
    const browseProducts = searchableProducts
      .slice(0, 20)
      .map(({ searchable, ...product }) => product);

    return {
      answer: browseProducts.length
        ? `Here are ${browseProducts.length} products from the ShopEase catalogue.`
        : "No approved products are currently available.",
      products: browseProducts,
      videos: [],
    };
  }

  const matched = searchableProducts.filter((product) => {
    const terms = q
      .replace(/[₹,?!.]/g, " ")
      .split(/\s+/)
      .filter((term) => term.length > 2);

    return (
      terms.some((term) => product.searchable.includes(term)) ||
      (budget !== null && Number(product.price) <= budget)
    );
  });

  const results = matched
    .filter((product) => {
      if (budget === null) return true;
      return Number(product.price) <= budget;
    })
    .slice(0, 20)
    .map(({ searchable, ...product }) => product);

  if (isVideo) {
    const product = results[0];

    const searchTerm = product
      ? `${product.brand || ""} ${product.name} review tutorial`
      : `${question} product review tutorial`;

    return {
      answer:
        "Here are YouTube search results related to your question. Please check the video details before relying on product specifications.",
      products: results,
      videos: [
        {
          title: `${product ? product.name : "Product"} — related videos`,
          url: youtubeLink(searchTerm),
        },
      ],
    };
  }

  if (isComparison) {
    return {
      answer:
        results.length >= 2
          ? "Here are matching products to compare. Check their prices, descriptions, and available specifications below."
          : "Please mention the names of two products available in ShopEase so I can help compare them.",
      products: results,
      videos: [],
    };
  }

  if (budget !== null) {
    const recommendations = searchableProducts
      .filter((product) => Number(product.price) <= budget)
      .sort((a, b) => Number(a.price) - Number(b.price))
      .slice(0, 20)
      .map(({ searchable, ...product }) => product);

    return {
      answer: recommendations.length
        ? `I found ${recommendations.length} product option(s) priced within ${formatPrice(budget)}. Compare the available details below.`
        : `I couldn't find an approved product priced within ${formatPrice(budget)}. Try a higher budget or another category.`,
      products: recommendations,
      videos: [],
    };
  }

  if (results.length) {
    return {
      answer:
        "I found these matching ShopEase products. You can check the listed prices and descriptions below.",
      products: results,
      videos: [],
    };
  }

  return {
    answer:
      "I couldn't find a matching product from the current catalogue. Try a product name, brand, category, or budget. I can also help find related YouTube searches.",
    products: [],
    videos: [
      {
        title: "Search YouTube for this topic",
        url: youtubeLink(question),
      },
    ],
  };
}

router.post("/", async (req, res) => {
  try {
    const question =
      typeof req.body?.message === "string"
        ? req.body.message.trim()
        : "";

    if (!question) {
      return res.status(400).json({
        success: false,
        message: "Please enter a question.",
      });
    }

    if (question.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Question must be 1000 characters or fewer.",
      });
    }

    const products = await getProducts();
    const result = answerQuestion(question, products);

    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Chatbot error:", error.message);

    return res.status(500).json({
      success: false,
      message: "The assistant is temporarily unavailable.",
    });
  }
});

module.exports = router;