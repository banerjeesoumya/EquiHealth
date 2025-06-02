import axios from 'axios';

interface FoodInfoResponse {
    name: string;
    ingredients: string;
    nutrition: Record<string, any>;
    barcode: string;
    image: string;
    allergens: string[];
    categories: string[];
    brands: string;
    labels: string[];
    quantity: string;
}

interface HealthScoreResponse {
    score: number;
    grade: string;
    advice: string;
    bmi: number;
    foodName: string;
}

interface DietaryCheckResponse {
    isCompatible: boolean;
    issues: string[];
    dietType: string;
}

interface UserMetrics {
    age: number;
    height: number;
    weight: number;
}

const filterEnglishTags = (input: string | string[] | undefined): string[] => {
    if (!input) return [];
    let arr: string[] = Array.isArray(input)
        ? input
        : typeof input === "string"
        ? input.split(",")
        : [];
    
    return arr
        .map((tag) => tag.trim())
        .filter((tag) => tag.startsWith("en:"))
        .map((tag) => tag.substring(3)); // remove 'en:' prefix
};

export const getFoodInfo = async (foodName?: string, barcode?: string): Promise<FoodInfoResponse> => {
    if (!foodName && !barcode) {
        throw new Error("Either provide the foodname or scan the barcode present at the back side of the food item");
    }

    try {
        const response = barcode
            ? await axios.get(`https://en.openfoodfacts.net/api/v2/product/${barcode}.json?`)
            : await axios.get(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${foodName}&search_simple=1&action=process&json=1`);

        const data = response.data;
        const product = barcode ? data.product : data.products[0];

        if (!product) {
            throw new Error("No product found with the provided barcode or food name");
        }

        return {
            name: product.product_name || "Unknown",
            ingredients: product.ingredients_text || "Not available",
            nutrition: product.nutriments || {},
            barcode: product.code || "Not available",
            image: product.image_url || "No image available",
            allergens: filterEnglishTags(product.allergens_tags || product.allergens),
            categories: filterEnglishTags(product.categories_tags || product.categories),
            brands: product.brands || "Not available",
            labels: filterEnglishTags(product.labels_tags || product.labels),
            quantity: product.quantity || "Not available",
        };
    } catch (error: any) {
        throw new Error(error.message || "Error while fetching food information");
    }
};

export const calculateHealthScore = async (
    userMetrics: UserMetrics,
    foodName?: string,
    barcode?: string
): Promise<HealthScoreResponse> => {
    if (!foodName && !barcode) {
        throw new Error("Provide either foodName or barcode as query parameter");
    }

    // Fetch food info
    const foodInfo = await getFoodInfo(foodName, barcode);

    // Calculate BMI: weight(kg) / (height(m))^2
    const heightInMeters = userMetrics.height / 100;
    const bmi = userMetrics.weight / (heightInMeters * heightInMeters);

    // Extract nutriments (use defaults if missing)
    const nutriments = foodInfo.nutrition || {};
    const fat = nutriments["fat_100g"] ?? 0;
    const saturatedFat = nutriments["saturated-fat_100g"] ?? 0;
    const sugars = nutriments["sugars_100g"] ?? 0;
    const fiber = nutriments["fiber_100g"] ?? 0;
    const proteins = nutriments["proteins_100g"] ?? 0;
    const salt = nutriments["salt_100g"] ?? 0;

    // Simple scoring logic example (customize as needed)
    let score = 100;

    if (bmi < 18.5) score -= 10; // underweight
    else if (bmi > 25) score -= 10; // overweight

    if (fat > 20) score -= 10;
    if (saturatedFat > 10) score -= 10;
    if (sugars > 15) score -= 10;
    if (fiber < 3) score -= 5;
    if (proteins < 5) score -= 5;
    if (salt > 1.5) score -= 10;

    // Clamp score between 0 and 100
    score = Math.max(0, Math.min(100, score));

    // Grade based on score
    let grade = "E";
    if (score >= 90) grade = "A";
    else if (score >= 80) grade = "B";
    else if (score >= 70) grade = "C";
    else if (score >= 60) grade = "D";

    // Simple advice generation
    let advice = "";
    if (score >= 80) advice = "Good nutritional profile.";
    else if (score >= 60) advice = "Moderate nutritional content; watch fats and sugars.";
    else advice = "Poor nutritional content; consider healthier options.";

    return {
        score,
        grade,
        advice,
        bmi: parseFloat(bmi.toFixed(2)),
        foodName: foodInfo.name,
    };
};

export const checkDietaryCompatibility = async (
    foodName: string | undefined,
    barcode: string | undefined,
    dietType: string
): Promise<DietaryCheckResponse> => {
    if (!dietType) {
        throw new Error("dietType is required (e.g., vegan, gluten-free)");
    }

    if (!foodName && !barcode) {
        throw new Error("Provide either foodName or barcode as query parameter");
    }

    const foodInfo = await getFoodInfo(foodName, barcode);

    const ingredientsText = foodInfo.ingredients.toLowerCase();
    const allergens = foodInfo.allergens.map((a) => a.toLowerCase());
    const labels = foodInfo.labels.map((l) => l.toLowerCase());

    // Define common exclusion keywords for diet types
    const dietExclusions: Record<string, string[]> = {
        vegan: ["milk", "egg", "meat", "honey", "gelatin", "cheese", "butter", "yogurt"],
        "gluten-free": ["wheat", "barley", "rye", "malt", "triticale"],
    };

    const exclusions = dietExclusions[dietType.toLowerCase()];
    if (!exclusions) {
        throw new Error(`Unsupported dietType: ${dietType}. Supported types: vegan, gluten-free`);
    }

    // Check for violations in ingredients, allergens, or labels
    const issues: string[] = [];
    exclusions.forEach((exclusion) => {
        if (
            ingredientsText.includes(exclusion) ||
            allergens.includes(exclusion) ||
            labels.includes(exclusion)
        ) {
            issues.push(exclusion);
        }
    });

    return {
        isCompatible: issues.length === 0,
        issues,
        dietType,
    };
}; 