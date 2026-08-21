import { Routes, Route } from "react-router-dom"
import Navbar from "@/components/shared/Navbar"
import AppFooter from "@/components/shared/AppFooter"
import HomePage from "@/pages/HomePage"
import PlaceDetailPage from "@/pages/PlaceDetailPage"
import FeedPage from "@/pages/FeedPage"
import CreatePostPage from "@/pages/CreatePostPage"
import ProfilePage from "@/pages/ProfilePage"
import LeaderboardPage from "@/pages/LeaderboardPage"
import ChatPage from "@/pages/ChatPage"
import OrderPage from "@/pages/OrderPage"
import OrderCartPage from "@/pages/OrderCartPage"
import PagePartnerPage from "@/pages/PagePartnerPage"

export default function App() {
  return (
    <div className="relative w-full min-h-screen overflow-x-hidden">
      {/* Content layer — sits above the fixed cinematic footer so it is only
          revealed once the user scrolls to the bottom. */}
      <div className="relative z-10 bg-background">
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/places/:id" element={<PlaceDetailPage />} />
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/post/new" element={<CreatePostPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/order" element={<OrderPage />} />
          <Route path="/order/keranjang" element={<OrderCartPage />} />
          <Route path="/mitra" element={<PagePartnerPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </div>
    </div>
  )
}
