import { inngest } from "../../../../config/inngest";
import Product from "../../../../models/Product";
import User from "../../../../models/User"; 
import { getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
// Types for clarity
interface OrderItem {
  product: string;
  quantity: number;
}

const key_id = process.env.RAZORPAY_KEY_ID;
const key_secret = process.env.RAZORPAY_SECRET_ID;


if (!key_id || !key_secret) {
  throw new Error("Missing Razorpay environment variables");
}

const razorpay = new Razorpay({ key_id, key_secret });
 


interface Address {
  fullName: string;
  phoneNumber: string;
  pincode: number;
  area: string;
  city: string;
  state: string;
}


export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { address, items }: { address: Address; items: OrderItem[] } =
      await request.json();

    if (!address || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "Invalid Data" },
        { status: 400 }
      );
    }


    // Calculate order amount
    let amount = 0;
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) continue;
      amount += product.offerPrice * item.quantity;
    }
  

    const totalAmount = (amount + Math.floor(amount * 0.02)) ; // add 2% fee

    // Create Razorpay Order
    const order = await razorpay.orders.create({
      amount: totalAmount *100 * 85 , // paise
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`,
      payment_capture: true,
    });

    await inngest.send({
      name: "order/created",
      data: {
        userId,
        address,
        items,
        amount: totalAmount  ,
        date: Date.now(),
        razorpayOrderId: order.id,
      },
    });

    // Clear user's cart
    const user = await User.findById(userId);
    if (user) {
      user.cartItems = [];
      await user.save();
    }

    return NextResponse.json({ 
     success: true,
      orderId: order.id,
      amount: order.amount, // in paise
      currency: order.currency,
      message: "Order created successfully", });
  } catch (error: unknown) {
    console.error("Order error:", error);
    return NextResponse.json(
      {
        success: false,
        message: (error as Error).message || "Something went wrong",
      },
      { status: 500 }
    );
  }
}

// import { inngest } from "@/config/inngest";
// import Product from "@/models/Product";
// import { getAuth, User } from "@clerk/nextjs/server";
// import { NextResponse } from "next/server";

// export async function POST(request){
//     try {
//         const {userId}=getAuth(request)

//         const {address,items}=await request.json();
//         if(!address||items.length==0){
//             return NextResponse.json({success:false,message:'Invalid Data'})
//         }

//         //calculate amount using items
//         const amount =await items.reduce(async(acc,item)=>{
//             const product=await Product.findById(item.product);
//             return await acc+product.offerPrice*item.quantity
//         },0)

//         await inngest.send({
//             name:'order/created',
//             data:{
//                 userId,
//                 address,
//                 items,
//                 amount:amount+Math.floor(amount*0.02),
//                 data:Date.now()
//             }

//         })
//         //clear user cart
//         const user=await User.findById(userId)
//         user.cartItems={}
//         await user.save();

//         return NextResponse.json({success:true,message:'Order-placed'})

//     } catch (error) {
//         console.log(error)
//          return NextResponse.json({success:false,message:error.message})

//     }
// }
