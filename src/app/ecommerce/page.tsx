// src/app/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { MapPin, Globe, ChevronDown, ShoppingCart, Menu, Search, ChevronLeft, ChevronRight, Star, Clock } from 'lucide-react'

// Mock Data
const categories = [
  { id: 1, title: 'Electronics', imageUrl: '/electronics.jpg', link: '/electronics' },
  { id: 2, title: 'Fashion', imageUrl: '/fashion.jpg', link: '/fashion' },
  { id: 3, title: 'Home & Kitchen', imageUrl: '/home.jpg', link: '/home' },
  { id: 4, title: 'Beauty', imageUrl: '/beauty.jpg', link: '/beauty' },
]

const bannerSlides = [
  { id: 1, imageUrl: '/banner1.jpg', altText: 'Ultimate Brand Sale', link: '/sale', title: 'Ultimate Brand Sale' },
  { id: 2, imageUrl: '/banner2.jpg', altText: 'Electronics Sale', link: '/electronics', title: 'Electronics Sale' },
  { id: 3, imageUrl: '/banner3.jpg', altText: 'Fashion Deals', link: '/fashion', title: 'Fashion Deals' },
]

const featuredProducts = [
  { id: 'p1', title: 'Wireless Earbuds', price: 1499, originalPrice: 2999, rating: 4.5, reviewCount: 2345, imageUrl: '/earbuds.jpg', isPrime: true, link: '/product/p1' },
  { id: 'p2', title: 'Smart Watch', price: 2999, originalPrice: 4999, rating: 4.2, reviewCount: 1876, imageUrl: '/watch.jpg', isPrime: true, link: '/product/p2' },
  { id: 'p3', title: 'Bluetooth Speaker', price: 1299, originalPrice: 1999, rating: 4.0, reviewCount: 945, imageUrl: '/speaker.jpg', isPrime: false, link: '/product/p3' },
  { id: 'p4', title: 'Laptop Backpack', price: 899, originalPrice: 1499, rating: 4.3, reviewCount: 2156, imageUrl: '/backpack.jpg', isPrime: true, link: '/product/p4' },
]

const topDeals = [
  { id: 'd1', title: 'Up to 70% off | Headphones', imageUrl: '/deal1.jpg', discount: 70, link: '/deal/d1', endTime: '8h 45m' },
  { id: 'd2', title: 'Starting ₹199 | Home decor', imageUrl: '/deal2.jpg', discount: 60, link: '/deal/d2', endTime: '3h 20m' },
  { id: 'd3', title: 'Up to 50% off | Kitchen appliances', imageUrl: '/deal3.jpg', discount: 50, link: '/deal/d3', endTime: '5h 15m' },
  { id: 'd4', title: 'Min 40% off | Clothing', imageUrl: '/deal4.jpg', discount: 40, link: '/deal/d4', endTime: '1h 30m' },
]

// Header Component
function Header() {
  const [isLocationOpen, setIsLocationOpen] = useState(false)
  const [isAccountOpen, setIsAccountOpen] = useState(false)

  return (
    <header className="bg-[#131921] text-white">
      <div className="flex items-center p-2 px-4">
        <Link href="/" className="mr-4">
          <div className="w-[120px] h-[36px] relative">
            {/* Replace with actual Amazon logo */}
            <div className="bg-white text-[#131921] font-bold p-1 rounded">Amazon.in</div>
          </div>
        </Link>
        
        <button 
          className="flex items-center p-1 border border-transparent hover:border-white rounded"
          onClick={() => setIsLocationOpen(!isLocationOpen)}
        >
          <MapPin size={18} />
          <div className="flex flex-col ml-1">
            <span className="text-xs text-gray-300">Deliver to</span>
            <span className="text-sm font-bold">India</span>
          </div>
        </button>
        
        <SearchBar />
        
        <div className="flex items-center p-1 mx-2 border border-transparent hover:border-white rounded">
          <Globe size={16} />
          <span className="mx-1">EN</span>
          <ChevronDown size={14} />
        </div>
        
        <div 
          className="relative p-1 mr-2 border border-transparent hover:border-white rounded"
          onMouseEnter={() => setIsAccountOpen(true)}
          onMouseLeave={() => setIsAccountOpen(false)}
        >
          <div className="flex flex-col">
            <span className="text-xs text-gray-300">Hello, sign in</span>
            <div className="flex items-center">
              <span className="text-sm font-bold">Account & Lists</span>
              <ChevronDown size={14} className="ml-1" />
            </div>
          </div>
        </div>
        
        <Link href="/orders" className="flex flex-col p-1 mr-2 border border-transparent hover:border-white rounded">
          <span className="text-xs text-gray-300">Returns</span>
          <span className="text-sm font-bold">& Orders</span>
        </Link>
        
        <Link href="/cart" className="flex items-center p-1 border border-transparent hover:border-white rounded">
          <div className="relative">
            <ShoppingCart size={24} />
            <span className="absolute -top-1 -right-1 bg-[#FFD814] text-black rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">0</span>
          </div>
          <span className="font-bold ml-1">Cart</span>
        </Link>
      </div>
      
      <nav className="flex items-center p-1 px-4 bg-[#232F3E]">
        <button className="flex items-center p-2 mr-4 hover:outline hover:outline-1 hover:outline-white">
          <Menu size={20} />
          <span className="ml-1 font-bold">All</span>
        </button>
        
        <ul className="flex">
          <li className="mr-4"><Link href="/fresh" className="hover:outline hover:outline-1 hover:outline-white p-1">Fresh</Link></li>
          <li className="mr-4"><Link href="/mx-player" className="hover:outline hover:outline-1 hover:outline-white p-1">MX Player</Link></li>
          <li className="mr-4"><Link href="/sell" className="hover:outline hover:outline-1 hover:outline-white p-1">Sell</Link></li>
          <li className="mr-4"><Link href="/bestsellers" className="hover:outline hover:outline-1 hover:outline-white p-1">Bestsellers</Link></li>
          <li className="mr-4"><Link href="/deals" className="hover:outline hover:outline-1 hover:outline-white p-1">Today's Deals</Link></li>
          <li className="mr-4"><Link href="/mobiles" className="hover:outline hover:outline-1 hover:outline-white p-1">Mobiles</Link></li>
          <li className="mr-4"><Link href="/prime" className="hover:outline hover:outline-1 hover:outline-white p-1">Prime</Link></li>
          <li className="mr-4"><Link href="/customer-service" className="hover:outline hover:outline-1 hover:outline-white p-1">Customer Service</Link></li>
        </ul>
      </nav>
    </header>
  )
}

// SearchBar Component
function SearchBar() {
  const [query, setQuery] = useState('')
  const [category, _setCategory] = useState('All')
  const [isCategoryOpen, setIsCategoryOpen] = useState(false)
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Searching for:', query, 'in category:', category)
  }
  
  return (
    <form className="flex flex-1 mx-4" onSubmit={handleSearch}>
      <div 
        className="bg-gray-100 text-black px-2 flex items-center rounded-l-md cursor-pointer"
        onClick={() => setIsCategoryOpen(!isCategoryOpen)}
      >
        <span className="text-sm">{category}</span>
        <ChevronDown size={14} className="ml-1" />
      </div>
      
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search Amazon.in"
        className="flex-1 p-2 text-black outline-none"
      />
      
      <button type="submit" className="bg-[#FFD814] text-black p-2 rounded-r-md hover:bg-[#F7CA00]">
        <Search size={20} />
      </button>
    </form>
  )
}

// HeroBanner Component
function HeroBanner() {
  const [currentSlide, setCurrentSlide] = useState(0)
  
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % bannerSlides.length)
  }
  
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + bannerSlides.length) % bannerSlides.length)
  }
  
  useEffect(() => {
    const interval = setInterval(nextSlide, 5000)
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div className="relative w-full h-[300px] md:h-[400px] overflow-hidden">
      {bannerSlides.map((slide, index) => (
        <div 
          key={slide.id}
          className={`absolute top-0 left-0 w-full h-full transition-opacity duration-500 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            {/* Replace with actual Image component when you have images */}
            <div className="text-2xl font-bold">{slide.title}</div>
          </div>
        </div>
      ))}
      
      <button 
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full"
        onClick={prevSlide}
      >
        <ChevronLeft size={24} />
      </button>
      
      <button 
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full"
        onClick={nextSlide}
      >
        <ChevronRight size={24} />
      </button>
      
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
        {bannerSlides.map((_, index) => (
          <button
            key={index}
            className={`w-3 h-3 rounded-full ${
              index === currentSlide ? 'bg-[#007185]' : 'bg-gray-300'
            }`}
            onClick={() => setCurrentSlide(index)}
          />
        ))}
      </div>
    </div>
  )
}
// CategoryCard Component
interface CategoryCardProps {
  title: string;
  imageUrl: string;
  link: string;
}

function CategoryCard({ title, imageUrl: _imageUrl, link }: CategoryCardProps) {
  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <div className="w-full h-[180px] bg-gray-100 mb-3 flex items-center justify-center">
        {/* Replace with actual Image component when you have images */}
        <div className="text-sm text-gray-500">{title} Image</div>
      </div>
      
      <Link href={link} className="text-[#007185] text-sm hover:underline hover:text-[#C7511F]">
        Shop now
      </Link>
    </div>
  )
}
// ProductCard Component
interface Product {
  originalPrice?: number;
  price: number;
  link: string;
  title: string;
  rating: number;
  reviewCount: number;
  isPrime: boolean;
}

function ProductCard({ product }: { product: Product }) {
  const discount = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0
  return (
    <div className="bg-white p-3 rounded">
      <Link href={product.link} className="block w-full h-[180px] bg-gray-50 mb-3 flex items-center justify-center">
        {/* Replace with actual Image component when you have images */}
        <div className="text-sm text-gray-500">{product.title} Image</div>
      </Link>
      
      <div>
        <Link href={product.link} className="text-sm hover:text-[#C7511F] line-clamp-2 mb-1">
          {product.title}
        </Link>
        
        <div className="flex items-center mb-1">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={14}
                fill={i < Math.floor(product.rating) ? "#FFA41C" : "none"}
                color={i < Math.floor(product.rating) ? "#FFA41C" : "#E3E6E6"}
              />
            ))}
          </div>
          <span className="text-xs text-[#007185] ml-1">{product.reviewCount}</span>
        </div>
        
        <div className="mb-1">
          <span className="text-lg font-bold">
            <span className="text-sm align-top">₹</span>
            {product.price.toLocaleString()}
          </span>
          
          {product.originalPrice && (
            <>
              <span className="text-sm text-gray-500 line-through ml-2">
                ₹{product.originalPrice.toLocaleString()}
              </span>
              <span className="text-sm text-[#CC0C39] ml-2">
                ({discount}% off)
              </span>
            </>
          )}
        </div>
        
        {product.isPrime && (
          <div className="flex items-center">
            <div className="bg-[#00A8E1] text-white text-xs px-1 mr-1">prime</div>
            <span className="text-xs">FREE Delivery</span>
          </div>
        )}
      </div>
    </div>
  )
}
// DealCard Component
interface Deal {
  link: string;
  discount: number;
  title: string;
  endTime: string;
}

function DealCard({ deal }: { deal: Deal }) {
  return (
    <div className="bg-white p-3 rounded">
      <Link href={deal.link} className="relative block w-full h-[150px] bg-gray-50 mb-3 flex items-center justify-center">
        <div className="absolute top-0 left-0 bg-[#CC0C39] text-white text-xs px-1 py-0.5">
          Up to {deal.discount}% off
        </div>
        {/* Replace with actual Image component when you have images */}
        <div className="text-sm text-gray-500">{deal.title} Image</div>
      </Link>
      
      <Link href={deal.link} className="text-sm hover:text-[#C7511F] line-clamp-2 mb-1">
        {deal.title}
      </Link>
      
      <div className="flex items-center text-xs text-gray-700">
        <Clock size={12} className="mr-1" />
        <span>Ends in {deal.endTime}</span>
      </div>
    </div>
  )
}
// ProductGrid Component
interface Product {
  id: string;
  // Add other product properties as needed
}

interface ProductGridProps {
  title: string;
  products: Product[];
  viewAllLink?: string;
}

function ProductGrid({ title, products, viewAllLink }: ProductGridProps) {
  return (
    <section className="bg-white p-4 rounded shadow mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{title}</h2>
        {viewAllLink && (
          <Link href={viewAllLink} className="text-[#007185] text-sm hover:underline hover:text-[#C7511F]">
            See all
          </Link>
        )}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}
// DealSection Component
interface Deal {
  id: string;
  // Add other deal properties as needed
}

interface DealSectionProps {
  title: string;
  deals: Deal[];
  viewAllLink?: string;
}

function DealSection({ title, deals, viewAllLink }: DealSectionProps) {
  return (
    <section className="bg-white p-4 rounded shadow mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{title}</h2>
        {viewAllLink && (
          <Link href={viewAllLink} className="text-[#007185] text-sm hover:underline hover:text-[#C7511F]">
            See all deals
          </Link>
        )}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} />
        ))}
      </div>
    </section>
  )
}

// Footer Component
function Footer() {
  return (
    <footer className="bg-[#232F3E] text-white pt-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-bold mb-3">Get to Know Us</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:underline">About Us</Link></li>
              <li><Link href="/careers" className="hover:underline">Careers</Link></li>
              <li><Link href="/press" className="hover:underline">Press Releases</Link></li>
              <li><Link href="/cares" className="hover:underline">Amazon Cares</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold mb-3">Connect with Us</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/facebook" className="hover:underline">Facebook</Link></li>
              <li><Link href="/twitter" className="hover:underline">Twitter</Link></li>
              <li><Link href="/instagram" className="hover:underline">Instagram</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold mb-3">Make Money with Us</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/sell" className="hover:underline">Sell on Amazon</Link></li>
              <li><Link href="/associates" className="hover:underline">Amazon Associates</Link></li>
              <li><Link href="/fulfill" className="hover:underline">Fulfillment by Amazon</Link></li>
              <li><Link href="/advertise" className="hover:underline">Advertise Your Products</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold mb-3">Let Us Help You</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/covid" className="hover:underline">COVID-19 and Amazon</Link></li>
              <li><Link href="/account" className="hover:underline">Your Account</Link></li>
              <li><Link href="/returns" className="hover:underline">Returns Centre</Link></li>
              <li><Link href="/help" className="hover:underline">Help</Link></li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="bg-[#131A22] py-4 text-center text-sm">
        <p>© 1996-2023, Amazon.com, Inc. or its affiliates</p>
      </div>
    </footer>
  )
}

// Main Page Component
export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <main>
        <HeroBanner />
        
        <div className="container mx-auto px-4 py-6">
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                title={category.title}
                imageUrl={category.imageUrl}
                link={category.link}
              />
            ))}
          </section>
          
          <DealSection
            title="Today's Deals"
            deals={topDeals}
            viewAllLink="/deals"
          />
          
          <ProductGrid
            title="Recommended for You"
            products={featuredProducts}
            viewAllLink="/recommendations"
          />
          
          <section className="bg-white p-4 rounded shadow mb-6">
            <h2 className="text-xl font-bold mb-4">Top Brands</h2>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-16 bg-gray-50 flex items-center justify-center">
                  <span className="text-sm text-gray-500">Brand {i}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}