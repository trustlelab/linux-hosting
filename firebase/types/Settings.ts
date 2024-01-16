
export type Parameters = {
    emotions: Array<string>,
    lengths: Array<string>,
    motives: Array<string>,
    style: Array<string>,
    address: Array<string>
}

export type InvoiceSettings = {
    last_used_number: number,
    number_offset: number,
    prices: Array<string>
}

export type Product = {
    id: number,
    price: number,
    discount: number
}

export type Calculations = {
    tokenProMail: {
        in: number,
        out: number
    },
    costPerToken: {
        in: number,
        out: number
    },
    products: Array<Product>,
    profitPercent: number,
    startCredits: number,
    savedMinutesProMail: number
}