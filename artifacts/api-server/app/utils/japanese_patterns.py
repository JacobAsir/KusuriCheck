"""Japanese keyword and regex banks for medicine label parsing."""
from __future__ import annotations

# Section header keywords by category
SECTION_HEADERS: dict[str, list[str]] = {
    "intended_use": ["効能", "効果", "効能・効果", "効能効果", "適応"],
    "dosage": ["用法", "用量", "用法・用量", "用法用量", "服用方法", "使用方法"],
    "warnings": ["使用上の注意", "注意", "警告", "してはいけないこと", "相談すること"],
    "ingredients": ["成分", "有効成分", "添加物", "成分・分量"],
    "storage": ["保管", "保管及び取扱い", "保管方法", "取扱い上の注意"],
    "age_restriction": ["年齢", "小児", "成人", "15歳", "12歳", "7歳"],
}

# Document classifier keyword weights
CLASSIFIER_WEIGHTS: dict[str, dict[str, int]] = {
    "otc": {
        "第1類医薬品": 5,
        "第2類医薬品": 5,
        "第3類医薬品": 5,
        "指定第2類医薬品": 6,
        "一般用医薬品": 4,
        "登録販売者": 3,
        "リスク区分": 3,
    },
    "supplement": {
        "栄養機能食品": 5,
        "栄養補助食品": 5,
        "健康食品": 4,
        "サプリメント": 5,
        "栄養成分表示": 4,
        "1日の摂取目安": 4,
        "機能性表示食品": 5,
    },
    "instruction_sheet": {
        "お薬手帳": 5,
        "服薬指導": 5,
        "処方箋": 4,
        "調剤年月日": 5,
        "薬局名": 3,
        "処方医": 4,
        "薬剤情報提供書": 6,
    },
    "package_insert_fragment": {
        "添付文書": 6,
        "効能・効果": 3,
        "用法・用量": 3,
        "使用上の注意": 3,
        "重要な基本的注意": 5,
        "副作用": 4,
    },
}

# High-risk warning patterns - trigger escalation
HIGH_RISK_PATTERNS: list[str] = [
    "処方箋医薬品",
    "要処方",
    "劇薬",
    "毒薬",
    "重篤",
    "重大な副作用",
    "致死",
    "アナフィラキシー",
    "ショック症状",
]

# Boxed warning style markers
BOXED_WARNING_PATTERNS: list[str] = [
    "警告",
    "重要な基本的注意",
    "★★★",
    "■警告■",
    "【警告】",
]

# "Do not use" patterns
DO_NOT_USE_PATTERNS: list[str] = [
    "次の人は使用しないこと",
    "使用しないでください",
    "服用しないこと",
]

# Caution categories
CAUTION_PATTERNS: dict[str, list[str]] = {
    "pregnant": ["妊婦", "妊娠中", "授乳中", "授乳婦"],
    "child": ["小児", "15歳未満", "12歳未満", "7歳未満", "幼児", "乳児"],
    "elderly": ["高齢者", "65歳以上"],
    "liver": ["肝機能", "肝臓", "肝障害"],
    "kidney": ["腎機能", "腎臓", "腎障害"],
}

# Side effect / consult markers
CONSULT_PATTERNS: list[str] = [
    "医師、薬剤師又は登録販売者に相談",
    "医師、薬剤師に相談",
    "医師に相談",
    "薬剤師に相談",
    "副作用",
]

# Dosing context phrases (used to detect dosage section)
DOSAGE_CONTEXT: list[str] = [
    "1日",
    "1回",
    "食後",
    "食前",
    "食間",
    "就寝前",
    "成人",
    "錠",
    "カプセル",
    "ml",
    "mg",
]


# English meaning hints for evidence lines
EVIDENCE_MEANINGS: dict[str, str] = {
    "効能": "indication / what it is used for",
    "効果": "intended effect",
    "用法": "how to take",
    "用量": "amount per dose",
    "注意": "caution",
    "使用上の注意": "precautions for use",
    "次の人は使用しないこと": "must not be used by these people",
    "保管": "storage instructions",
    "成分": "ingredients",
    "1日": "daily dosing reference",
    "食後": "after meals",
    "食前": "before meals",
    "就寝前": "before bedtime",
    "成人": "adult dosing",
    "小児": "pediatric reference",
    "妊婦": "pregnancy caution",
    "授乳中": "breastfeeding caution",
    "高齢者": "elderly caution",
    "腎機能": "kidney function caution",
    "肝機能": "liver function caution",
    "副作用": "side effect notice",
}

# Common Japanese OTC ingredients for cross-referencing and validation
COMMON_INGREDIENTS: dict[str, str] = {
    "イブプロフェン": "Ibuprofen",
    "ロキソプロフェン": "Loxoprofen",
    "アセトアミノフェン": "Acetaminophen",
    "無水カフェイン": "Anhydrous Caffeine",
    "酸化マグネシウム": "Magnesium Oxide",
    "アリルイソプロピルアセチル尿素": "Allylisopropylacetylurea",
    "トラネキサム酸": "Tranexamic acid",
    "ジフェンヒドラミン": "Diphenhydramine",
    "ブロムヘキシン": "Bromhexine",
    "デキストロメトルファン": "Dextromethorphan",
    "グアイフェネシン": "Guaifenesin",
    "クロルフェニラミン": "Chlorpheniramine",
    "ジヒドロコデイン": "Dihydrocodeine",
    "メチルエフェドリン": "Methylephedrine",
}
