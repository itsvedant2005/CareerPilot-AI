# backend/app/routes/aptitude_routes.py

import random
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.auth import get_current_student
from app.database import students_collection


router = APIRouter(
    prefix="/api/aptitude",
    tags=["Aptitude"]
)


# ============================================================
# HELPERS
# ============================================================

def make_question(
    question_id: str,
    category: str,
    difficulty: str,
    topic: str,
    question: str,
    options: List[str],
    correct_answer: str,
    explanation: str
) -> Dict[str, Any]:
    """
    Creates one question.
    Options are shuffled so the correct answer is not always
    in the same position.
    """
    shuffled_options = list(options)
    random.shuffle(shuffled_options)

    return {
        "id": question_id,
        "category": category,
        "difficulty": difficulty,
        "topic": topic,
        "question": question,
        "options": shuffled_options,
        "correct_answer": correct_answer,
        "explanation": explanation
    }


def add_question(
    bank: List[Dict[str, Any]],
    category: str,
    difficulty: str,
    topic: str,
    question: str,
    options: List[str],
    correct_answer: str,
    explanation: str
):
    question_id = f"q{len(bank) + 1}"

    bank.append(
        make_question(
            question_id=question_id,
            category=category,
            difficulty=difficulty,
            topic=topic,
            question=question,
            options=options,
            correct_answer=correct_answer,
            explanation=explanation
        )
    )


# ============================================================
# QUESTION BANK
# ============================================================

QUESTION_BANK: List[Dict[str, Any]] = []


# ============================================================
# QUANTITATIVE APTITUDE
# ============================================================

# -------------------- EASY --------------------

add_question(
    QUESTION_BANK,
    "Quantitative",
    "Easy",
    "Percentages",
    "What is 20% of 250?",
    ["40", "50", "60", "45"],
    "50",
    "20% of 250 = 20/100 × 250 = 50."
)

add_question(
    QUESTION_BANK,
    "Quantitative",
    "Easy",
    "Profit & Loss",
    "An article is bought for ₹500 and sold for ₹600. What is the profit percentage?",
    ["10%", "15%", "20%", "25%"],
    "20%",
    "Profit = 600 - 500 = ₹100. Profit% = 100/500 × 100 = 20%."
)

add_question(
    QUESTION_BANK,
    "Quantitative",
    "Easy",
    "Ratio & Proportion",
    "The ratio of boys to girls in a class is 3:2. If there are 30 boys, how many girls are there?",
    ["15", "20", "25", "18"],
    "20",
    "3 parts = 30, so 1 part = 10. Girls = 2 × 10 = 20."
)

add_question(
    QUESTION_BANK,
    "Quantitative",
    "Easy",
    "Averages",
    "What is the average of 10, 20, 30, 40 and 50?",
    ["25", "30", "35", "40"],
    "30",
    "Sum = 150 and number of values = 5. Average = 150/5 = 30."
)

add_question(
    QUESTION_BANK,
    "Quantitative",
    "Easy",
    "Simple Interest",
    "Find the simple interest on ₹2,000 at 5% per annum for 2 years.",
    ["₹100", "₹150", "₹200", "₹250"],
    "₹200",
    "SI = PRT/100 = 2000 × 5 × 2 / 100 = ₹200."
)

add_question(
    QUESTION_BANK,
    "Quantitative",
    "Easy",
    "Time, Speed & Distance",
    "A car travels at 60 km/h. How far will it travel in 2 hours?",
    ["100 km", "110 km", "120 km", "130 km"],
    "120 km",
    "Distance = Speed × Time = 60 × 2 = 120 km."
)

add_question(
    QUESTION_BANK,
    "Quantitative",
    "Easy",
    "Number System",
    "Which of the following is a prime number?",
    ["21", "29", "39", "51"],
    "29",
    "29 has only two factors: 1 and 29."
)

add_question(
    QUESTION_BANK,
    "Quantitative",
    "Easy",
    "HCF & LCM",
    "What is the HCF of 24 and 36?",
    ["6", "8", "12", "18"],
    "12",
    "The highest common factor of 24 and 36 is 12."
)

add_question(
    QUESTION_BANK,
    "Quantitative",
    "Easy",
    "Algebra",
    "If x + 7 = 15, what is the value of x?",
    ["6", "7", "8", "9"],
    "8",
    "x = 15 - 7 = 8."
)

add_question(
    QUESTION_BANK,
    "Quantitative",
    "Easy",
    "Probability",
    "What is the probability of getting a head when a fair coin is tossed once?",
    ["1/4", "1/2", "1/3", "2/3"],
    "1/2",
    "There are 2 equally likely outcomes and 1 favorable outcome."
)

add_question(
    QUESTION_BANK,
    "Quantitative",
    "Easy",
    "Geometry",
    "What is the perimeter of a square with side 8 cm?",
    ["24 cm", "32 cm", "36 cm", "64 cm"],
    "32 cm",
    "Perimeter of square = 4 × side = 4 × 8 = 32 cm."
)

add_question(
    QUESTION_BANK,
    "Quantitative",
    "Easy",
    "Ages",
    "A father is 40 years old and his son is 10 years old. What is their age difference?",
    ["20 years", "25 years", "30 years", "35 years"],
    "30 years",
    "40 - 10 = 30 years."
)


# -------------------- MEDIUM --------------------

add_question(
    QUESTION_BANK,
    "Quantitative",
    "Medium",
    "Percentages",
    "The price of an item increases from ₹800 to ₹920. What is the percentage increase?",
    ["10%", "12%", "15%", "20%"],
    "15%",
    "Increase = 120. Percentage = 120/800 × 100 = 15%."
)

add_question(
    QUESTION_BANK,
    "Quantitative",
    "Medium",
    "Profit & Loss",
    "An article is sold for ₹1,080 at a profit of 20%. What is its cost price?",
    ["₹800", "₹900", "₹920", "₹960"],
    "₹900",
    "CP = SP / 1.20 = 1080 / 1.2 = ₹900."
)

add_question(
    QUESTION_BANK,
    "Quantitative",
    "Medium",
    "Ratio & Proportion",
    "Two numbers are in the ratio 5:7 and their sum is 96. What is the smaller number?",
    ["35", "40", "42", "45"],
    "40",
    "12 parts = 96, so 1 part = 8. Smaller = 5 × 8 = 40."
)

add_question(
    QUESTION_BANK,
    "Quantitative",
    "Medium",
    "Averages",
    "The average of 6 numbers is 24. If one number is removed, the average of the remaining 5 numbers is 22. What is the removed number?",
    ["28", "30", "32", "34"],
    "34",
    "Total = 6×24 = 144. Remaining total = 5×22 = 110. Removed = 34."
)

add_question(
    QUESTION_BANK,
    "Quantitative",
    "Medium",
    "Compound Interest",
    "What is the compound interest on ₹1,000 at 10% per annum for 2 years?",
    ["₹200", "₹210", "₹220", "₹240"],
    "₹210",
    "Amount = 1000 × 1.1² = 1210. CI = 1210 - 1000 = ₹210."
)

add_question(
    QUESTION_BANK,
    "Quantitative",
    "Medium",
    "Time & Work",
    "A can complete a work in 10 days and B can complete it in 15 days. In how many days can they complete it together?",
    ["5 days", "6 days", "7 days", "8 days"],
    "6 days",
    "Combined work per day = 1/10 + 1/15 = 1/6."
)

add_question(
    QUESTION_BANK,
    "Quantitative",
    "Medium",
    "Trains",
    "A train travels at 72 km/h. How many meters does it travel in 10 seconds?",
    ["180 m", "200 m", "220 m", "240 m"],
    "200 m",
    "72 km/h = 20 m/s. Distance = 20 × 10 = 200 m."
)

add_question(
    QUESTION_BANK,
    "Quantitative",
    "Medium",
    "Boats & Streams",
    "A boat moves at 10 km/h in still water and the stream speed is 2 km/h. What is its downstream speed?",
    ["8 km/h", "10 km/h", "12 km/h", "14 km/h"],
    "12 km/h",
    "Downstream speed = boat speed + stream speed = 10 + 2 = 12 km/h."
)

add_question(
    QUESTION_BANK,
    "Quantitative",
    "Medium",
    "Algebra",
    "If 2x + 5 = 17, what is x?",
    ["5", "6", "7", "8"],
    "6",
    "2x = 12, so x = 6."
)

add_question(
    QUESTION_BANK,
    "Quantitative",
    "Medium",
    "Permutation & Combination",
    "In how many ways can 3 different books be arranged on a shelf?",
    ["3", "6", "9", "12"],
    "6",
    "3! = 3 × 2 × 1 = 6."
)

add_question(
    QUESTION_BANK,
    "Quantitative",
    "Medium",
    "Probability",
    "A die is rolled once. What is the probability of getting an even number?",
    ["1/6", "1/3", "1/2", "2/3"],
    "1/2",
    "Even outcomes are 2, 4 and 6: 3 favorable outcomes out of 6."
)

add_question(
    QUESTION_BANK,
    "Quantitative",
    "Medium",
    "Mensuration",
    "What is the area of a circle with radius 7 cm? Use π = 22/7.",
    ["144 cm²", "154 cm²", "164 cm²", "176 cm²"],
    "154 cm²",
    "Area = πr² = 22/7 × 49 = 154 cm²."
)


# -------------------- HARD --------------------

add_question(
    QUESTION_BANK,
    "Quantitative",
    "Hard",
    "Percentages",
    "A number is increased by 20% and then decreased by 20%. What is the net percentage change?",
    ["0%", "2% decrease", "4% decrease", "4% increase"],
    "4% decrease",
    "Net change = 20 - 20 - (20×20/100) = -4%."
)

add_question(
    QUESTION_BANK,
    "Quantitative",
    "Hard",
    "Profit & Loss",
    "A shopkeeper marks an article 25% above cost price and gives a discount of 10%. What is the profit percentage?",
    ["10%", "12.5%", "15%", "7.5%"],
    "12.5%",
    "Take CP=100. MP=125. SP=112.5 after 10% discount, so profit = 12.5%."
)

add_question(
    QUESTION_BANK,
    "Quantitative",
    "Hard",
    "Time & Work",
    "A can complete a work in 12 days and B in 18 days. If they work together for 4 days, what fraction of the work remains?",
    ["1/3", "4/9", "5/9", "2/3"],
    "5/9",
    "Combined rate = 1/12 + 1/18 = 5/36. In 4 days, work = 20/36 = 5/9. Remaining = 4/9."
)

# Corrected explicit question: previous computed remaining mismatch avoided by using a fresh one.
QUESTION_BANK.pop()

add_question(
    QUESTION_BANK,
    "Quantitative",
    "Hard",
    "Time & Work",
    "A can finish a job in 12 days and B in 18 days. If they work together for 4 days, what fraction of the work is completed?",
    ["4/9", "5/9", "2/3", "7/18"],
    "5/9",
    "Daily rate = 1/12 + 1/18 = 5/36. In 4 days = 20/36 = 5/9."
)

add_question(
    QUESTION_BANK,
    "Quantitative",
    "Hard",
    "Time, Speed & Distance",
    "A person travels 120 km at 40 km/h and returns at 60 km/h. What is the average speed for the complete journey?",
    ["45 km/h", "48 km/h", "50 km/h", "52 km/h"],
    "48 km/h",
    "Total distance = 240 km. Total time = 3 + 2 = 5 hours. Average speed = 240/5 = 48 km/h."
)

add_question(
    QUESTION_BANK,
    "Quantitative",
    "Hard",
    "Ages",
    "The present ages of A and B are in the ratio 4:5. After 6 years, their ratio will be 5:6. What is A's present age?",
    ["20 years", "24 years", "30 years", "32 years"],
    "24 years",
    "Let ages be 4x and 5x. (4x+6)/(5x+6)=5/6 gives 24x+36=25x+30, so x=6 and A=24."
)

add_question(
    QUESTION_BANK,
    "Quantitative",
    "Hard",
    "Number System",
    "What is the remainder when 2^10 is divided by 7?",
    ["1", "2", "3", "4"],
    "2",
    "2^3 = 8 ≡ 1 mod 7. Therefore 2^10 = 2^(9+1) ≡ 2."
)

add_question(
    QUESTION_BANK,
    "Quantitative",
    "Hard",
    "LCM & HCF",
    "The HCF of two numbers is 12 and their LCM is 420. If one number is 60, what is the other number?",
    ["72", "84", "96", "108"],
    "84",
    "Product of numbers = HCF × LCM = 12 × 420. Other number = 5040/60 = 84."
)

add_question(
    QUESTION_BANK,
    "Quantitative",
    "Hard",
    "Permutation & Combination",
    "How many 3-digit numbers can be formed using 1, 2, 3, 4 and 5 without repetition?",
    ["30", "40", "50", "60"],
    "60",
    "5 choices for first digit, 4 for second and 3 for third: 5×4×3 = 60."
)

add_question(
    QUESTION_BANK,
    "Quantitative",
    "Hard",
    "Probability",
    "Two fair dice are thrown. What is the probability that the sum is 8?",
    ["1/9", "5/36", "1/6", "7/36"],
    "5/36",
    "Favorable pairs are (2,6),(3,5),(4,4),(5,3),(6,2): 5 out of 36."
)

add_question(
    QUESTION_BANK,
    "Quantitative",
    "Hard",
    "Geometry",
    "The sides of a right triangle are 6 cm, 8 cm and 10 cm. What is its area?",
    ["20 cm²", "24 cm²", "30 cm²", "40 cm²"],
    "24 cm²",
    "Area = 1/2 × 6 × 8 = 24 cm²."
)


# ============================================================
# LOGICAL REASONING
# ============================================================

# -------------------- EASY --------------------

add_question(
    QUESTION_BANK,
    "Logical Reasoning",
    "Easy",
    "Number Series",
    "Find the next number: 2, 4, 6, 8, ?",
    ["9", "10", "11", "12"],
    "10",
    "The series increases by 2."
)

add_question(
    QUESTION_BANK,
    "Logical Reasoning",
    "Easy",
    "Number Series",
    "Find the next number: 5, 10, 15, 20, ?",
    ["22", "24", "25", "30"],
    "25",
    "The pattern is +5."
)

add_question(
    QUESTION_BANK,
    "Logical Reasoning",
    "Easy",
    "Letter Series",
    "Find the next letter: A, C, E, G, ?",
    ["H", "I", "J", "K"],
    "I",
    "Letters increase by two positions."
)

add_question(
    QUESTION_BANK,
    "Logical Reasoning",
    "Easy",
    "Coding-Decoding",
    "If CAT is coded as DBU, how is DOG coded using the same pattern?",
    ["EPH", "EOG", "DPH", "FPH"],
    "EPH",
    "Each letter is shifted one position forward."
)

add_question(
    QUESTION_BANK,
    "Logical Reasoning",
    "Easy",
    "Directions",
    "A person walks 5 km north and then 5 km east. In which direction is he from the starting point?",
    ["North-West", "North-East", "South-East", "South-West"],
    "North-East",
    "Moving north and east places the person northeast of the starting point."
)

add_question(
    QUESTION_BANK,
    "Logical Reasoning",
    "Easy",
    "Blood Relations",
    "Rahul is the son of Priya. Priya is the sister of Amit. How is Amit related to Rahul?",
    ["Brother", "Uncle", "Father", "Cousin"],
    "Uncle",
    "Amit is Priya's brother, so he is Rahul's maternal uncle."
)

add_question(
    QUESTION_BANK,
    "Logical Reasoning",
    "Easy",
    "Analogy",
    "Bird : Nest :: Bee : ?",
    ["Hive", "Web", "Den", "Burrow"],
    "Hive",
    "A bee lives in a hive just as a bird lives in a nest."
)

add_question(
    QUESTION_BANK,
    "Logical Reasoning",
    "Easy",
    "Classification",
    "Find the odd one out: Apple, Mango, Banana, Carrot",
    ["Apple", "Mango", "Banana", "Carrot"],
    "Carrot",
    "Carrot is a vegetable; the others are fruits."
)

add_question(
    QUESTION_BANK,
    "Logical Reasoning",
    "Easy",
    "Ranking",
    "Riya is taller than Neha but shorter than Priya. Who is the tallest?",
    ["Riya", "Neha", "Priya", "Cannot determine"],
    "Priya",
    "Priya > Riya > Neha."
)


# -------------------- MEDIUM --------------------

add_question(
    QUESTION_BANK,
    "Logical Reasoning",
    "Medium",
    "Number Series",
    "Find the next number: 3, 6, 12, 24, ?",
    ["36", "42", "48", "54"],
    "48",
    "Each number is multiplied by 2."
)

add_question(
    QUESTION_BANK,
    "Logical Reasoning",
    "Medium",
    "Number Series",
    "Find the next number: 1, 4, 9, 16, ?",
    ["20", "24", "25", "36"],
    "25",
    "These are consecutive squares: 1², 2², 3², 4², 5²."
)

add_question(
    QUESTION_BANK,
    "Logical Reasoning",
    "Medium",
    "Letter Series",
    "Find the next letter: B, E, H, K, ?",
    ["M", "N", "O", "P"],
    "N",
    "Each letter moves forward by 3 positions."
)

add_question(
    QUESTION_BANK,
    "Logical Reasoning",
    "Medium",
    "Coding-Decoding",
    "If APPLE is written as BQQMF, how is BALL written?",
    ["CBMM", "CBLL", "CCMM", "CAML"],
    "CBMM",
    "Each letter is shifted one position forward."
)

add_question(
    QUESTION_BANK,
    "Logical Reasoning",
    "Medium",
    "Blood Relations",
    "A is the brother of B. C is the mother of B. D is the father of C. How is D related to A?",
    ["Father", "Grandfather", "Uncle", "Brother"],
    "Grandfather",
    "D is the father of A's mother, making D A's maternal grandfather."
)

add_question(
    QUESTION_BANK,
    "Logical Reasoning",
    "Medium",
    "Directions",
    "A man walks 10 m south, then turns left and walks 10 m, then turns left again and walks 10 m. In which direction is he from the start?",
    ["North", "South", "East", "West"],
    "North",
    "He ends 10 m north of the starting point."
)

add_question(
    QUESTION_BANK,
    "Logical Reasoning",
    "Medium",
    "Syllogism",
    "Statements: All cats are animals. Some animals are black. Which conclusion definitely follows?",
    [
        "All cats are black",
        "Some cats are black",
        "All cats are animals",
        "No animals are black"
    ],
    "All cats are animals",
    "This conclusion directly follows from the first statement."
)

add_question(
    QUESTION_BANK,
    "Logical Reasoning",
    "Medium",
    "Analogy",
    "Book : Read :: Food : ?",
    ["Cook", "Eat", "Buy", "Sell"],
    "Eat",
    "A book is read and food is eaten."
)

add_question(
    QUESTION_BANK,
    "Logical Reasoning",
    "Medium",
    "Classification",
    "Find the odd one out: Square, Triangle, Circle, Cube",
    ["Square", "Triangle", "Circle", "Cube"],
    "Cube",
    "Cube is a three-dimensional solid; the others are two-dimensional shapes."
)

add_question(
    QUESTION_BANK,
    "Logical Reasoning",
    "Medium",
    "Ranking",
    "In a class of 40 students, Raj ranks 12th from the top. What is his rank from the bottom?",
    ["27th", "28th", "29th", "30th"],
    "29th",
    "Rank from bottom = 40 - 12 + 1 = 29."
)


# -------------------- HARD --------------------

add_question(
    QUESTION_BANK,
    "Logical Reasoning",
    "Hard",
    "Number Series",
    "Find the next number: 2, 6, 12, 20, 30, ?",
    ["40", "42", "44", "46"],
    "42",
    "The differences are 4, 6, 8, 10, so next difference is 12."
)

add_question(
    QUESTION_BANK,
    "Logical Reasoning",
    "Hard",
    "Number Series",
    "Find the next number: 1, 2, 6, 24, 120, ?",
    ["480", "600", "720", "840"],
    "720",
    "The numbers are factorials: 1!, 2!, 3!, 4!, 5!, so next is 6! = 720."
)

add_question(
    QUESTION_BANK,
    "Logical Reasoning",
    "Hard",
    "Letter Series",
    "Find the next letter: Z, W, T, Q, ?",
    ["N", "O", "P", "R"],
    "N",
    "Each letter moves backward by 3."
)

add_question(
    QUESTION_BANK,
    "Logical Reasoning",
    "Hard",
    "Coding-Decoding",
    "If TABLE is coded as UBCMF, how is CHAIR coded?",
    ["DIBJS", "DIBIR", "DHBJS", "EIBJS"],
    "DIBJS",
    "Each character is shifted one position forward."
)

add_question(
    QUESTION_BANK,
    "Logical Reasoning",
    "Hard",
    "Blood Relations",
    "Pointing to a woman, Amit said, 'She is the daughter of the only son of my grandfather.' How is the woman related to Amit?",
    ["Sister", "Mother", "Aunt", "Cousin"],
    "Sister",
    "The only son of Amit's grandfather is Amit's father; his daughter is Amit's sister."
)

add_question(
    QUESTION_BANK,
    "Logical Reasoning",
    "Hard",
    "Directions",
    "A person walks 8 km east, turns left and walks 6 km, then turns left and walks 8 km. How far is he from the starting point?",
    ["4 km", "6 km", "8 km", "14 km"],
    "6 km",
    "The person ends 6 km north of the starting point."
)

add_question(
    QUESTION_BANK,
    "Logical Reasoning",
    "Hard",
    "Syllogism",
    "Statements: All engineers are graduates. Some graduates are writers. Which conclusion is definitely true?",
    [
        "All writers are engineers",
        "Some engineers are writers",
        "All engineers are graduates",
        "No graduate is a writer"
    ],
    "All engineers are graduates",
    "Only the direct statement can be definitely concluded."
)

add_question(
    QUESTION_BANK,
    "Logical Reasoning",
    "Hard",
    "Analogy",
    "Clock : Time :: Thermometer : ?",
    ["Heat", "Pressure", "Temperature", "Weather"],
    "Temperature",
    "A clock measures time; a thermometer measures temperature."
)

add_question(
    QUESTION_BANK,
    "Logical Reasoning",
    "Hard",
    "Classification",
    "Find the odd one out: 8, 27, 64, 100, 125",
    ["8", "27", "64", "100"],
    "100",
    "8, 27, 64 and 125 are cubes of integers. 100 is not."
)

add_question(
    QUESTION_BANK,
    "Logical Reasoning",
    "Hard",
    "Ranking",
    "In a row, A is 15th from the left and 18th from the right. How many people are in the row?",
    ["31", "32", "33", "34"],
    "32",
    "Total = 15 + 18 - 1 = 32."
)


# ============================================================
# VERBAL ABILITY
# ============================================================

# -------------------- EASY --------------------

add_question(
    QUESTION_BANK,
    "Verbal",
    "Easy",
    "Synonyms",
    "Choose the synonym of 'Rapid'.",
    ["Slow", "Fast", "Weak", "Late"],
    "Fast",
    "Rapid means fast or quick."
)

add_question(
    QUESTION_BANK,
    "Verbal",
    "Easy",
    "Antonyms",
    "Choose the antonym of 'Ancient'.",
    ["Old", "Historic", "Modern", "Traditional"],
    "Modern",
    "Ancient means very old; modern is its opposite."
)

add_question(
    QUESTION_BANK,
    "Verbal",
    "Easy",
    "Grammar",
    "Choose the grammatically correct sentence.",
    [
        "She go to college every day.",
        "She goes to college every day.",
        "She going to college every day.",
        "She gone to college every day."
    ],
    "She goes to college every day.",
    "With singular subject 'She', the verb is 'goes'."
)

add_question(
    QUESTION_BANK,
    "Verbal",
    "Easy",
    "Fill in the Blanks",
    "He is ___ honest person.",
    ["a", "an", "the", "no article"],
    "an",
    "The word 'honest' begins with a vowel sound, so 'an' is used."
)

add_question(
    QUESTION_BANK,
    "Verbal",
    "Easy",
    "Tenses",
    "Choose the correct form: 'I ___ football yesterday.'",
    ["play", "played", "playing", "plays"],
    "played",
    "The word 'yesterday' indicates past tense."
)

add_question(
    QUESTION_BANK,
    "Verbal",
    "Easy",
    "Synonyms",
    "Choose the synonym of 'Begin'.",
    ["End", "Start", "Stop", "Close"],
    "Start",
    "Begin means start."
)

add_question(
    QUESTION_BANK,
    "Verbal",
    "Easy",
    "Antonyms",
    "Choose the antonym of 'Expand'.",
    ["Increase", "Grow", "Contract", "Develop"],
    "Contract",
    "Contract means become smaller, opposite of expand."
)

# -------------------- MEDIUM --------------------

add_question(
    QUESTION_BANK,
    "Verbal",
    "Medium",
    "Synonyms",
    "Choose the synonym of 'Abundant'.",
    ["Scarce", "Plentiful", "Tiny", "Empty"],
    "Plentiful",
    "Abundant means available in large quantities."
)

add_question(
    QUESTION_BANK,
    "Verbal",
    "Medium",
    "Antonyms",
    "Choose the antonym of 'Optimistic'.",
    ["Hopeful", "Positive", "Pessimistic", "Confident"],
    "Pessimistic",
    "Pessimistic expresses the opposite outlook to optimistic."
)

add_question(
    QUESTION_BANK,
    "Verbal",
    "Medium",
    "Grammar",
    "Choose the correct sentence.",
    [
        "Neither of the boys have completed the work.",
        "Neither of the boys has completed the work.",
        "Neither of the boys are completed the work.",
        "Neither boys has completed the work."
    ],
    "Neither of the boys has completed the work.",
    "'Neither' is singular and takes 'has' in this construction."
)

add_question(
    QUESTION_BANK,
    "Verbal",
    "Medium",
    "Fill in the Blanks",
    "The manager is responsible ___ the final decision.",
    ["for", "of", "at", "with"],
    "for",
    "The correct preposition is 'responsible for'."
)

add_question(
    QUESTION_BANK,
    "Verbal",
    "Medium",
    "Articles",
    "She wants to become ___ engineer.",
    ["a", "an", "the", "no article"],
    "an",
    "Engineer begins with a vowel sound, so 'an' is correct."
)

add_question(
    QUESTION_BANK,
    "Verbal",
    "Medium",
    "Tenses",
    "By the time we reached the station, the train ___.",
    ["left", "has left", "had left", "leaves"],
    "had left",
    "The earlier past action uses past perfect: 'had left'."
)

add_question(
    QUESTION_BANK,
    "Verbal",
    "Medium",
    "Sentence Correction",
    "Identify the correct sentence.",
    [
        "He is senior than me.",
        "He is senior to me.",
        "He is more senior than to me.",
        "He senior to me."
    ],
    "He is senior to me.",
    "The standard construction is 'senior to'."
)

# -------------------- HARD --------------------

add_question(
    QUESTION_BANK,
    "Verbal",
    "Hard",
    "Synonyms",
    "Choose the synonym of 'Meticulous'.",
    ["Careless", "Precise", "Lazy", "Rough"],
    "Precise",
    "Meticulous means very careful and precise."
)

add_question(
    QUESTION_BANK,
    "Verbal",
    "Hard",
    "Antonyms",
    "Choose the antonym of 'Transparent'.",
    ["Clear", "Visible", "Opaque", "Bright"],
    "Opaque",
    "Opaque means not allowing light to pass through and, figuratively, not clear."
)

add_question(
    QUESTION_BANK,
    "Verbal",
    "Hard",
    "Grammar",
    "Choose the grammatically correct sentence.",
    [
        "Each of the students have submitted their assignment.",
        "Each of the students has submitted his or her assignment.",
        "Each students has submitted their assignment.",
        "Each of students have submitted assignment."
    ],
    "Each of the students has submitted his or her assignment.",
    "'Each' is singular and takes 'has'."
)

add_question(
    QUESTION_BANK,
    "Verbal",
    "Hard",
    "Fill in the Blanks",
    "The proposal was rejected because it was not in accordance ___ the policy.",
    ["to", "with", "for", "at"],
    "with",
    "The correct expression is 'in accordance with'."
)

add_question(
    QUESTION_BANK,
    "Verbal",
    "Hard",
    "Tenses",
    "If she ___ harder, she would have passed the exam.",
    ["studies", "studied", "had studied", "has studied"],
    "had studied",
    "This is a third conditional sentence, so past perfect is required."
)

add_question(
    QUESTION_BANK,
    "Verbal",
    "Hard",
    "Articles",
    "He is ___ MBA graduate from a reputed institute.",
    ["a", "an", "the", "no article"],
    "an",
    "MBA is pronounced 'em-bee-ay', beginning with a vowel sound."
)

add_question(
    QUESTION_BANK,
    "Verbal",
    "Hard",
    "Sentence Correction",
    "Choose the correct sentence.",
    [
        "No sooner did he arrive when the meeting started.",
        "No sooner had he arrived than the meeting started.",
        "No sooner he arrived than the meeting started.",
        "No sooner had he arrive when the meeting started."
    ],
    "No sooner had he arrived than the meeting started.",
    "The standard construction is 'No sooner...than'."
)


# ============================================================
# DATA INTERPRETATION
# ============================================================

# -------------------- EASY --------------------

add_question(
    QUESTION_BANK,
    "Data Interpretation",
    "Easy",
    "Table Interpretation",
    "A store sold 20, 30, 25 and 35 units from Monday to Thursday respectively. What was the total number of units sold?",
    ["100", "105", "110", "115"],
    "110",
    "20 + 30 + 25 + 35 = 110."
)

add_question(
    QUESTION_BANK,
    "Data Interpretation",
    "Easy",
    "Table Interpretation",
    "A company sold 40 laptops in January and 60 in February. What was the increase?",
    ["10", "15", "20", "25"],
    "20",
    "Increase = 60 - 40 = 20 laptops."
)

add_question(
    QUESTION_BANK,
    "Data Interpretation",
    "Easy",
    "Table Interpretation",
    "A student scored 70, 80 and 90 in three tests. What is the average score?",
    ["75", "80", "82", "85"],
    "80",
    "Average = (70+80+90)/3 = 80."
)

add_question(
    QUESTION_BANK,
    "Data Interpretation",
    "Easy",
    "Pie/Table",
    "A class has 50 students, of whom 20 are girls. What percentage of the class are girls?",
    ["20%", "30%", "40%", "50%"],
    "40%",
    "20/50 × 100 = 40%."
)

add_question(
    QUESTION_BANK,
    "Data Interpretation",
    "Easy",
    "Ratio Analysis",
    "A company has 120 employees, of whom 72 are men. What is the number of women?",
    ["38", "48", "52", "58"],
    "48",
    "Women = 120 - 72 = 48."
)

add_question(
    QUESTION_BANK,
    "Data Interpretation",
    "Easy",
    "Percentage Analysis",
    "A shop had 500 customers in a month. If 100 were new customers, what percentage were new customers?",
    ["10%", "15%", "20%", "25%"],
    "20%",
    "100/500 × 100 = 20%."
)

# -------------------- MEDIUM --------------------

add_question(
    QUESTION_BANK,
    "Data Interpretation",
    "Medium",
    "Table Analysis",
    "Sales of a product were 120 units in January and 150 units in February. What was the percentage increase?",
    ["20%", "25%", "30%", "35%"],
    "25%",
    "Increase = 30. Percentage increase = 30/120 × 100 = 25%."
)

add_question(
    QUESTION_BANK,
    "Data Interpretation",
    "Medium",
    "Table Analysis",
    "A company earned ₹2 lakh, ₹3 lakh and ₹5 lakh in three months. What percentage of the total earnings came in the third month?",
    ["40%", "45%", "50%", "55%"],
    "50%",
    "Total = 10 lakh. Third month = 5/10 × 100 = 50%."
)

add_question(
    QUESTION_BANK,
    "Data Interpretation",
    "Medium",
    "Ratio Analysis",
    "A school has 600 students. 240 study science. What percentage of students study science?",
    ["30%", "35%", "40%", "45%"],
    "40%",
    "240/600 × 100 = 40%."
)

add_question(
    QUESTION_BANK,
    "Data Interpretation",
    "Medium",
    "Average Analysis",
    "The sales for four days were 45, 55, 65 and 75. What was the average daily sale?",
    ["55", "60", "65", "70"],
    "60",
    "Total = 240. Average = 240/4 = 60."
)

add_question(
    QUESTION_BANK,
    "Data Interpretation",
    "Medium",
    "Comparison",
    "Department A sold 240 units and Department B sold 300 units. How many percent more did B sell than A?",
    ["20%", "25%", "30%", "35%"],
    "25%",
    "Difference = 60. 60/240 × 100 = 25%."
)

add_question(
    QUESTION_BANK,
    "Data Interpretation",
    "Medium",
    "Percentage Analysis",
    "A company has 800 employees. 35% are women. How many women employees are there?",
    ["240", "260", "280", "300"],
    "280",
    "35% of 800 = 280."
)

# -------------------- HARD --------------------

add_question(
    QUESTION_BANK,
    "Data Interpretation",
    "Hard",
    "Multi-step Table",
    "A company sold 500, 650 and 850 units in three quarters. What was the percentage increase from the first to the third quarter?",
    ["50%", "60%", "70%", "80%"],
    "70%",
    "Increase = 850 - 500 = 350. 350/500 × 100 = 70%."
)

add_question(
    QUESTION_BANK,
    "Data Interpretation",
    "Hard",
    "Ratio Analysis",
    "A company has 900 employees. The ratio of technical to non-technical employees is 5:4. How many technical employees are there?",
    ["400", "450", "500", "550"],
    "500",
    "Total parts = 9. One part = 100. Technical = 5×100 = 500."
)

add_question(
    QUESTION_BANK,
    "Data Interpretation",
    "Hard",
    "Average Analysis",
    "The average sales for five months is 240 units. If the first four months total 880 units, what were the sales in the fifth month?",
    ["280", "300", "320", "340"],
    "320",
    "Total five-month sales = 5×240 = 1200. Fifth month = 1200 - 880 = 320."
)

add_question(
    QUESTION_BANK,
    "Data Interpretation",
    "Hard",
    "Percentage Analysis",
    "A company's revenue rises from ₹12 lakh to ₹15 lakh while expenses rise from ₹8 lakh to ₹10 lakh. What is the increase in profit?",
    ["₹0 lakh", "₹0.5 lakh", "₹1 lakh", "₹1.5 lakh"],
    "₹1 lakh",
    "Initial profit = 12 - 8 = 4 lakh. Final profit = 15 - 10 = 5 lakh. Increase = 1 lakh."
)

add_question(
    QUESTION_BANK,
    "Data Interpretation",
    "Hard",
    "Ratio Analysis",
    "The ratio of boys to girls in a school is 7:5. If the total number of students is 480, how many girls are there?",
    ["180", "200", "220", "240"],
    "200",
    "Total parts = 12. One part = 40. Girls = 5×40 = 200."
)

add_question(
    QUESTION_BANK,
    "Data Interpretation",
    "Hard",
    "Comparison",
    "A product's sales increased from 2,400 units to 3,000 units. If the increase was due to three equal monthly increases, what was the total increase per month?",
    ["100", "150", "200", "300"],
    "200",
    "Total increase = 600. Divided equally over 3 months gives 200 units per month."
)


# ============================================================
# MIXED CATEGORY QUESTIONS
# ============================================================

# Mixed questions are represented by their actual category.
# When category="Mixed" is selected, all categories are considered.


# ============================================================
# VALID VALUES
# ============================================================

VALID_CATEGORIES = {
    "Mixed",
    "Quantitative",
    "Logical Reasoning",
    "Verbal",
    "Data Interpretation"
}

VALID_DIFFICULTIES = {
    "Easy",
    "Medium",
    "Hard"
}

VALID_COUNTS = {10, 15, 20}


# ============================================================
# REQUEST MODELS
# ============================================================

class AptitudeStartRequest(BaseModel):
    category: str = "Mixed"
    difficulty: str = "Medium"
    question_count: int = Field(default=10, ge=10, le=20)


class AptitudeAnswer(BaseModel):
    question_id: str
    selected_answer: Optional[str] = None


class AptitudeSubmitRequest(BaseModel):
    # Accept the answer payload from the frontend without FastAPI 422 errors.
    # The submit endpoint normalizes dict/list formats itself.
    answers: Any = {}


# ============================================================
# FIND QUESTION
# ============================================================

QUESTION_MAP = {
    question["id"]: question
    for question in QUESTION_BANK
}


def public_question(question: Dict[str, Any]) -> Dict[str, Any]:
    """
    Never send the correct answer to the frontend during the test.
    """
    return {
        "id": question["id"],
        "category": question["category"],
        "difficulty": question["difficulty"],
        "topic": question["topic"],
        "question": question["question"],
        "options": question["options"]
    }


# ============================================================
# SEEN QUESTION IDS
# ============================================================

async def get_seen_question_ids(student: Dict[str, Any]) -> set:
    """
    Returns all question IDs already served to this student.

    Important:
    - Submitted questions are stored.
    - Active test questions are also stored immediately.
    - Therefore closing/restarting a test cannot cause those questions
      to appear again.
    """

    seen = student.get("aptitude_question_history", [])

    if not isinstance(seen, list):
        seen = []

    active_test = student.get("active_aptitude")

    if isinstance(active_test, dict):
        active_ids = active_test.get("question_ids", [])

        if isinstance(active_ids, list):
            seen = seen + active_ids

    return {
        str(question_id)
        for question_id in seen
        if question_id
    }


# ============================================================
# BUILD QUESTION POOL
# ============================================================

def get_preferred_pool(
    category: str,
    difficulty: str
) -> List[Dict[str, Any]]:

    if category == "Mixed":
        return [
            question
            for question in QUESTION_BANK
            if question["difficulty"] == difficulty
        ]

    return [
        question
        for question in QUESTION_BANK
        if question["category"] == category
        and question["difficulty"] == difficulty
    ]


def get_fallback_pools(
    category: str,
    difficulty: str
) -> List[List[Dict[str, Any]]]:

    # --------------------------------------------------------
    # MIXED
    # --------------------------------------------------------
    if category == "Mixed":
        return [
            [
                q for q in QUESTION_BANK
                if q["difficulty"] == difficulty
            ],
            list(QUESTION_BANK)
        ]

    # --------------------------------------------------------
    # SPECIFIC CATEGORY
    #
    # NEVER use another category.
    # First try same category + selected difficulty.
    # Then same category with other difficulties.
    # --------------------------------------------------------
    return [
        [
            q for q in QUESTION_BANK
            if q["category"] == category
            and q["difficulty"] == difficulty
        ],
        [
            q for q in QUESTION_BANK
            if q["category"] == category
        ]
    ]


# ============================================================
# START APTITUDE TEST
# ============================================================

@router.post("/start")
async def start_aptitude_test(
    request: AptitudeStartRequest,
    current_student: Dict[str, Any] = Depends(get_current_student)
):

    category = request.category.strip()
    difficulty = request.difficulty.strip()
    question_count = request.question_count

    # --------------------------------------------------------
    # Validation
    # --------------------------------------------------------

    if category not in VALID_CATEGORIES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid category. Choose from: {', '.join(VALID_CATEGORIES)}"
        )

    if difficulty not in VALID_DIFFICULTIES:
        raise HTTPException(
            status_code=400,
            detail="Invalid difficulty. Choose Easy, Medium or Hard."
        )

    if question_count not in VALID_COUNTS:
        raise HTTPException(
            status_code=400,
            detail="Question count must be 10, 15 or 20."
        )

    # --------------------------------------------------------
    # Already seen
    # --------------------------------------------------------

    seen_ids = await get_seen_question_ids(current_student)

    # --------------------------------------------------------
    # Preferred pool
    # --------------------------------------------------------

    selected_questions: List[Dict[str, Any]] = []

    preferred_pool = get_preferred_pool(
        category,
        difficulty
    )

    fresh_preferred = [
        q for q in preferred_pool
        if q["id"] not in seen_ids
    ]

    selected_questions.extend(fresh_preferred)

    # --------------------------------------------------------
    # Fallback pools
    # --------------------------------------------------------

    if len(selected_questions) < question_count:

        fallback_pools = get_fallback_pools(
            category,
            difficulty
        )

        already_added = {
            q["id"]
            for q in selected_questions
        }

        for pool in fallback_pools:

            fresh_pool = [
                q
                for q in pool
                if q["id"] not in seen_ids
                and q["id"] not in already_added
            ]

            random.shuffle(fresh_pool)

            for question in fresh_pool:

                if len(selected_questions) >= question_count:
                    break

                selected_questions.append(question)
                already_added.add(question["id"])

            if len(selected_questions) >= question_count:
                break

    # --------------------------------------------------------
    # Entire bank exhausted
    # --------------------------------------------------------

    if len(selected_questions) < question_count:

        # Start a NEW cycle only when the entire available bank
        # has been exhausted.

        await students_collection.update_one(
            {"_id": current_student["_id"]},
            {
                "$set": {
                    "aptitude_question_history": []
                }
            }
        )

        seen_ids = set()

        selected_questions = []

        preferred_pool = get_preferred_pool(
            category,
            difficulty
        )

        fresh_preferred = list(preferred_pool)

        selected_questions.extend(fresh_preferred)

        if len(selected_questions) < question_count:

            fallback_pools = get_fallback_pools(
                category,
                difficulty
            )

            already_added = {
                q["id"]
                for q in selected_questions
            }

            for pool in fallback_pools:

                fresh_pool = [
                    q
                    for q in pool
                    if q["id"] not in already_added
                ]

                random.shuffle(fresh_pool)

                for question in fresh_pool:

                    if len(selected_questions) >= question_count:
                        break

                    selected_questions.append(question)
                    already_added.add(question["id"])

                if len(selected_questions) >= question_count:
                    break

    # --------------------------------------------------------
    # Final safety check
    # --------------------------------------------------------

    if len(selected_questions) < question_count:
        raise HTTPException(
            status_code=500,
            detail=(
                f"Question bank contains only "
                f"{len(selected_questions)} usable questions."
            )
        )

    # --------------------------------------------------------
    # Random selection
    # --------------------------------------------------------

    selected_questions = random.sample(
        selected_questions,
        question_count
    )

    question_ids = [
        question["id"]
        for question in selected_questions
    ]

    # --------------------------------------------------------
    # Test metadata
    # --------------------------------------------------------

    test_id = f"apt_{current_student['_id']}_{int(datetime.now(timezone.utc).timestamp())}"

    started_at = datetime.now(timezone.utc)

    time_limit_seconds = question_count * 60

    active_test = {
        "test_id": test_id,
        "category": category,
        "difficulty": difficulty,
        "question_count": question_count,
        "time_limit_seconds": time_limit_seconds,
        "started_at": started_at.isoformat(),
        "question_ids": question_ids
    }

    # --------------------------------------------------------
    # IMPORTANT:
    # Mark questions as SEEN immediately.
    #
    # This prevents:
    # Student starts test
    # Student answers 2 questions
    # Student closes browser
    # Student starts again
    #
    # Old questions will NOT reappear.
    # --------------------------------------------------------

    await students_collection.update_one(
        {"_id": current_student["_id"]},
        {
            "$set": {
                "active_aptitude": active_test
            },
            "$addToSet": {
                "aptitude_question_history": {
                    "$each": question_ids
                }
            }
        }
    )

    # --------------------------------------------------------
    # Response
    # --------------------------------------------------------

    return {
        "success": True,
        "message": "Aptitude test started.",
        "test_id": test_id,
        "category": category,
        "difficulty": difficulty,
        "question_count": question_count,
        "time_limit_seconds": time_limit_seconds,
        "started_at": started_at.isoformat(),
        "questions": [
            public_question(question)
            for question in selected_questions
        ]
    }


# ============================================================
# ACTIVE TEST
# ============================================================

@router.get("/active")
async def get_active_aptitude_test(
    current_student: Dict[str, Any] = Depends(get_current_student)
):

    active_test = current_student.get("active_aptitude")

    if not active_test:
        return {
            "success": True,
            "active": False,
            "test": None
        }

    question_ids = active_test.get("question_ids", [])

    questions = []

    for question_id in question_ids:

        question = QUESTION_MAP.get(str(question_id))

        if question:
            questions.append(
                public_question(question)
            )

    return {
        "success": True,
        "active": True,
        "test": {
            **active_test,
            "questions": questions
        }
    }


# ============================================================
# SUBMIT TEST
# ============================================================

@router.post("/submit")
async def submit_aptitude_test(
    request: AptitudeSubmitRequest,
    current_student: Dict[str, Any] = Depends(get_current_student)
):

    active_test = current_student.get("active_aptitude")

    if not active_test:
        raise HTTPException(
            status_code=400,
            detail="No active aptitude test found."
        )

    question_ids = active_test.get("question_ids", [])

    if not question_ids:
        raise HTTPException(
            status_code=400,
            detail="Active test contains no questions."
        )

    # ========================================================
    # NORMALIZE ANSWERS
    # Supports BOTH:
    # 1) {"q1": "50", "q2": "20"}
    # 2) [{"question_id":"q1", "selected_answer":"50"}]
    # ========================================================

    answer_map: Dict[str, Optional[str]] = {}
    incoming_answers = request.answers

    if isinstance(incoming_answers, dict):

        for question_id, selected_answer in incoming_answers.items():

            question_id = str(question_id)

            if question_id not in question_ids:
                continue

            if selected_answer is not None:
                selected_answer = str(selected_answer).strip()

            answer_map[question_id] = selected_answer

    elif isinstance(incoming_answers, list):

        for answer in incoming_answers:

            if not isinstance(answer, dict):
                continue

            question_id = answer.get("question_id")
            selected_answer = answer.get("selected_answer")

            if question_id is None:
                continue

            question_id = str(question_id)

            if question_id not in question_ids:
                continue

            if selected_answer is not None:
                selected_answer = str(selected_answer).strip()

            answer_map[question_id] = selected_answer

    else:
        raise HTTPException(
            status_code=422,
            detail="Invalid answers format. Expected object or array."
        )

    # ========================================================
    # TIME CALCULATION
    # ========================================================

    started_at_string = active_test.get("started_at")

    elapsed_seconds = 0
    timed_out = False

    if started_at_string:

        try:
            started_at = datetime.fromisoformat(
                started_at_string.replace("Z", "+00:00")
            )

            if started_at.tzinfo is None:
                started_at = started_at.replace(
                    tzinfo=timezone.utc
                )

            elapsed_seconds = int(
                (datetime.now(timezone.utc) - started_at).total_seconds()
            )

            time_limit_seconds = int(
                active_test.get(
                    "time_limit_seconds",
                    len(question_ids) * 60
                )
            )

            timed_out = elapsed_seconds > (time_limit_seconds + 5)

        except Exception:
            elapsed_seconds = 0
            timed_out = False

    # ========================================================
    # EVALUATE ANSWERS
    # ========================================================

    correct_count = 0
    wrong_count = 0
    unanswered_count = 0
    review = []

    for question_id in question_ids:

        question = QUESTION_MAP.get(str(question_id))

        if not question:
            continue

        selected_answer = answer_map.get(str(question_id))
        correct_answer = question["correct_answer"]

        if not selected_answer:

            unanswered_count += 1

            review.append({
                "question_id": question["id"],
                "question": question["question"],
                "topic": question["topic"],
                "category": question["category"],
                "difficulty": question["difficulty"],
                "options": question["options"],
                "selected_answer": None,
                "correct_answer": correct_answer,
                "is_correct": False,
                "status": "unanswered",
                "explanation": question["explanation"]
            })

        elif selected_answer == correct_answer:

            correct_count += 1

            review.append({
                "question_id": question["id"],
                "question": question["question"],
                "topic": question["topic"],
                "category": question["category"],
                "difficulty": question["difficulty"],
                "options": question["options"],
                "selected_answer": selected_answer,
                "correct_answer": correct_answer,
                "is_correct": True,
                "status": "correct",
                "explanation": question["explanation"]
            })

        else:

            wrong_count += 1

            review.append({
                "question_id": question["id"],
                "question": question["question"],
                "topic": question["topic"],
                "category": question["category"],
                "difficulty": question["difficulty"],
                "options": question["options"],
                "selected_answer": selected_answer,
                "correct_answer": correct_answer,
                "is_correct": False,
                "status": "incorrect",
                "explanation": question["explanation"]
            })

    # ========================================================
    # SCORE
    # ========================================================

    total_questions = len(question_ids)

    percentage = 0.0

    if total_questions > 0:
        percentage = round(
            (correct_count / total_questions) * 100,
            2
        )

    completed_at = datetime.now(timezone.utc)

    attempt = {
        "test_id": active_test.get("test_id"),
        "category": active_test.get("category"),
        "difficulty": active_test.get("difficulty"),
        "question_count": total_questions,
        "correct_count": correct_count,
        "wrong_count": wrong_count,
        "unanswered_count": unanswered_count,
        "percentage": percentage,
        "score": correct_count,
        "total_score": total_questions,
        "started_at": active_test.get("started_at"),
        "completed_at": completed_at.isoformat(),
        "elapsed_seconds": elapsed_seconds,
        "timed_out": timed_out,
        "review": review
    }

    # Question IDs are NOT added here because /start already marks them
    # as seen. This guarantees no-repeat even for abandoned tests.
    await students_collection.update_one(
        {"_id": current_student["_id"]},
        {
            "$push": {
                "aptitude_history": {
                    "$each": [attempt],
                    "$slice": -50
                }
            },
            "$unset": {
                "active_aptitude": ""
            }
        }
    )

    return {
        "success": True,
        "message": "Aptitude test submitted successfully.",
        "result": {
            "test_id": attempt["test_id"],
            "category": attempt["category"],
            "difficulty": attempt["difficulty"],
            "question_count": total_questions,
            "correct_count": correct_count,
            "wrong_count": wrong_count,
            "unanswered_count": unanswered_count,
            "percentage": percentage,
            "score": correct_count,
            "total_score": total_questions,
            "elapsed_seconds": elapsed_seconds,
            "timed_out": timed_out,
            "review": review
        }
    }

# ============================================================
# DELETE ACTIVE TEST
# ============================================================

@router.delete("/active")
async def delete_active_aptitude_test(
    current_student: Dict[str, Any] = Depends(get_current_student)
):

    active_test = current_student.get(
        "active_aptitude"
    )

    if not active_test:
        return {
            "success": True,
            "message": "No active aptitude test found."
        }

    await students_collection.update_one(
        {"_id": current_student["_id"]},
        {
            "$unset": {
                "active_aptitude": ""
            }
        }
    )

    return {
        "success": True,
        "message": "Active aptitude test cleared."
    }


# ============================================================
# HISTORY
# ============================================================

@router.get("/history")
async def get_aptitude_history(
    current_student: Dict[str, Any] = Depends(get_current_student)
):

    history = current_student.get(
        "aptitude_history",
        []
    )

    if not isinstance(history, list):
        history = []

    # Latest first
    history = list(reversed(history))

    return {
        "success": True,
        "history": history
    }