import { AgricultureIcon, CommercialIcon, IndustrialIcon, ResidentialIcon } from "../../../assets/icons/SvgIcon";

export const limit = 10;
export const MAX_LENGTH_READ_MORE_DESCRIPTION = 150;

export const PROPERTY_TYPE_ICONS: Record<string, React.ComponentType> = {
    'Residential': ResidentialIcon,
    'Commercial': CommercialIcon,
    'Industrial': IndustrialIcon,
    'Agricultural': AgricultureIcon,
    'Mixed-use': AgricultureIcon,

    'Sole Proprietorship': AgricultureIcon,
    'Partnership Firm': AgricultureIcon,
    'HUF (Hindu Undivided Family)': AgricultureIcon,
    'Private Limited Company': AgricultureIcon,
    'Public Limited Company': AgricultureIcon,
    'Society': AgricultureIcon,
    'Association of Persons (AOP) / Body of Individuals (BOI)': AgricultureIcon,
    'Trust': AgricultureIcon,
    'Liquidator': AgricultureIcon,
    'Limited Liability Partnership': AgricultureIcon,
    'Artificial Juridical Person': AgricultureIcon,
    'Public Sector Banks': AgricultureIcon,
    'Government Departments / Agency': AgricultureIcon,
    'Foreign Portfolio': AgricultureIcon,
    'Section 8 Companies (Companies Act, 2013)': AgricultureIcon,
    'Not Categorized': AgricultureIcon,
    'Others': AgricultureIcon,
}; 