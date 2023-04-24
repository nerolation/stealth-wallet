import os
import logging
import asyncio
import random
import pandas as pd
import hashlib
from py_ecc.secp256k1 import *
import datetime
import sha3
from ecdsa.keys import VerifyingKey
from ecdsa.curves import SECP256k1
from asyncio import ensure_future
from telegram import Update
from telegram.ext import (ApplicationBuilder, ContextTypes, CommandHandler, MessageHandler, filters)

# Set up logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO
)

user_state = {}
user_last_message_time = {}

with open("tmp/telegramkey.txt", "r") as file:
    KEY = file.read().strip()

logger = logging.getLogger(__name__)

# Set up the CSV file to store private keys
csv_file = 'users/user_registrations.csv'
new_user_file = "users/new_users.txt"
announcement_file = 'users/announcements.csv'
processed_announcements_file = "tmp/processed_announcements.txt"


prefix_msg = [
    "Whoohoo!", 
    "Juhuuii!", 
    "Sheeesh!", 
    "Yeeeah!", 
    "Whoohoo!", 
    "Yiipiiee!",
    "Hooray!",
    "Yay!",
    "Woo-hoo!",
    "Yippee!",
    "Hurrah!",
    "Yeehaw!",
    "Heck yeah!",
    "Aww yeah!",
    "Woot woot!",
    "Hip hip hooray!",
    "Yessiree!",
    "Oh yeah!"
]

success_message = "{} 🎉\n\nSomeone interacted with a stealth address that belongs to you:\nhttps://sepolia.beaconcha.in/address/{}\n\nHead over to stealth-wallet.xyz to retrieve the private key to that stealth address. 🙌\n\n🎯 Provide the following information to enjoy a faster parsing process:\n\nEphemeral Public Key: {}"

if not os.path.exists(csv_file):
    df = pd.DataFrame(columns=['user_id', 'private_key', 'public_key'])
    df.to_csv(csv_file, index=False)
    
if not os.path.exists(new_user_file):
    with open(new_user_file, "w") as file:
        file.write("")


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await context.bot.send_message(chat_id=update.effective_chat.id, text="🤖🌐 Welcome to the stealth-wallet.xyz Assistant! 🌐🤖 \nYour go-to telegram bot for secure and unlinkable transactions on the Ethereum blockchain. Let's maintain your privacy together! 💼🔒\n\nI'm a bot that notifies you on incoming transactions to a stealth address that you control. For that, send me your viewing private key and your stealth meta-address and I'll take care of the rest.\n\nPlease consider adopting the following best practices to ensure the maximum privacy for yourself and your fellows:\n\n1️⃣ Avoid Commingling Doxxed Funds: If you've received funds to a stealth address, do not mix them with funds from an address that has been doxxed or linked to your identity. Keep these transactions separate to maintain your privacy and prevent revealing your association with the stealth address.\n\n2️⃣ Safeguard Your Parsing Private Key: The parsing private key is a critical component in stealth address transactions, as it enables you to detect incoming payments. Always keep this key secure and only share it with trusted third parties for assistance in the parsing process. Avoid storing it on internet-connected devices or sharing it with others.\nNotably, stealth addresses would not need any third party involved and your can use them without another party involved by performing the parsing yourself.\n\n⚠️ NEVER share your spending private key with anyone!⚠️\n\n Type /help to get more assistance.\nType \showkey to get you currently registered viewing private key.\n\nTo begin, just drop your viewing private key here into the chat...")


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    help_text = (
        "Available commands:\n"
        "/start - Start the bot and receive a welcome message\n"
        "/help - Show this help message\n"
        "/showkey - Show the registered viewing private key\n"
        "\nIn general, it works quite simple:\nYou provide me with your viewing private key and your stealth meta-address"
        " and I will notify you when I see incoming transactions to a stealth address you control."
    )
    await context.bot.send_message(chat_id=update.effective_chat.id, text=help_text)


async def send_key(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await context.bot.send_message(chat_id=update.effective_chat.id, text="Please send your 32-byte private key as a plain text message.")


    
def is_valid_private_key(private_key):
    if len(private_key) == 66 and private_key.startswith("0x"):
        return True
    return False

def is_valid_stealth_meta_address(stealth_meta_address):
    if len(stealth_meta_address) == 141 and stealth_meta_address.startswith("st:eth:0x"):
        return True
    return False

def print_with_timestamp(text: str):
    current_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"{current_time} | {text}")
    

async def show_key(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.message.from_user.id
    all_users = pd.read_csv(csv_file)
   
    user = all_users[all_users["user_id"] == user_id]
    if len(user.index) > 0:
        await context.bot.send_message(
                chat_id=user_id, 
                text=f"🔑 This is the viewing private key registered: {user['private_key'].values[0]} 🔐"
            )
    else:
        await context.bot.send_message(
                chat_id=user_id, 
                text=f"🔑 Nothing found 🔐"
            )
    
    
    
async def handle_keys(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.message.from_user.id
    input_key = update.message.text
    
    now = datetime.datetime.now()

    # Check if user sent a message within the last 5 seconds
    if user_id in user_last_message_time and (now - user_last_message_time[user_id]).total_seconds() < 3:
        print_with_timestamp(f"User {user_id} sent messages too frequently.")
        return

    # Update the user's last message time
    user_last_message_time[user_id] = now
    
    all_users = pd.read_csv(csv_file)
    
    

    if user_id not in user_state:
        if is_valid_private_key(input_key):  # Replace this with a function that checks the validity of private keys
            if user_id in all_users["user_id"].values:
                this_user = all_users[all_users["user_id"] == user_id]
                if this_user["private_key"].values[0] == input_key:
                    await context.bot.send_message(
                        chat_id=update.effective_chat.id, 
                        text="🔑 Your Viewing Private is already registered. Provide a different one to overwrite. 🔐"
                    )
                    return
                else: 
                    all_users = all_users[all_users["user_id"] != user_id]
                    all_users.to_csv(csv_file, index=False)
            user_state[user_id] = {'private_key': input_key}
            await context.bot.send_message(
                chat_id=update.effective_chat.id, 
                text="🔑 Viewing Private key received. Now, please send your stealth meta-address (starting with st:eth:0x...). 🔐"
            )
        else:
            # Add a default message for unrecognized input
            default_message = "🤖 I didn't understand your input. Please send a valid viewing private key or press /start for general information."
            await context.bot.send_message(chat_id=update.effective_chat.id, text=default_message)
    else:
        if is_valid_stealth_meta_address(input_key):  # Replace this with a function that checks the validity of public keys
            public_key = input_key[7:75]
            private_key = user_state[user_id]['private_key']

            new_row = pd.DataFrame({'user_id': [user_id], 'private_key': [private_key], 'public_key': [public_key]})
            new_row.to_csv(csv_file, mode='a', header=False, index=False)

            del user_state[user_id]
            await context.bot.send_message(
                chat_id=update.effective_chat.id, 
                text="✅ Successfully received and stored your private key and public key."
            )
            with open(new_user_file, "a") as file:
                file.write(public_key + "\n")
        else:
            await context.bot.send_message(
                chat_id=update.effective_chat.id, 
                text="❌ Invalid input. Please send a valid stealth meta-address."
            )



def parse_announcement(spending_public_key, ephermeral_public_key, private_key, stealth_address_given, view_tag):
    view_tag = int(view_tag, 16)
    private_key = int(private_key, 16)
    spending_public_key_uncomp = get_public_key_coordinates(spending_public_key[2:])
    ephermeral_public_key_uncomp = get_public_key_coordinates(ephermeral_public_key[2:])
    Q = secp256k1.multiply(ephermeral_public_key_uncomp, private_key)
    Q_hex = sha3.keccak_256(Q[0].to_bytes(32, "big")+Q[1].to_bytes(32, "big")).hexdigest()
    Q_hashed = bytearray.fromhex(Q_hex)
    
    if int(Q_hashed[0]) == view_tag:
        P_stealth = secp256k1.add(spending_public_key_uncomp, secp256k1.privtopub(Q_hashed))
        P_stealth_address  = "0x"+ sha3.keccak_256(P_stealth[0].to_bytes(32, "big")
                                                + P_stealth[1].to_bytes(32, "big")
                                                ).hexdigest()[-40:]
    
        return P_stealth_address == stealth_address_given
    else:
        return False
    

def get_public_key_coordinates(public_key_hex):
    if len(public_key_hex) != 66:  # 33 bytes * 2 characters per byte
        raise ValueError("Public key hex string should be 33 bytes long (66 characters)")

    vk = VerifyingKey.from_string(bytes.fromhex(public_key_hex), curve=SECP256k1)
    pub_key = vk.to_string('uncompressed').hex()

    x = int(pub_key[2:66], 16)
    y = int(pub_key[66:], 16)

    return (x, y)

def build_success_msg(stealthAddress, ephemeralPubKey):
    randprefix = prefix_msg[random.randint(0, len(prefix_msg)-1)]
    return success_message.format(randprefix, stealthAddress, ephemeralPubKey)


async def parse_all_announcements(context: ContextTypes.DEFAULT_TYPE):

    while True:
        with open(new_user_file, "r") as file:
            new_users = file.read().split("\n")
        new_users.remove('')

        all_users = pd.read_csv(csv_file)
        all_annoucements = pd.read_csv(announcement_file)

        # Load processed announcements
        if os.path.exists(processed_announcements_file):
            with open(processed_announcements_file, "r") as file:
                processed_announcements = set(file.read().split("\n"))
        else:
            processed_announcements = set()

        if len(new_users) > 0:
            print_with_timestamp(f"{len(new_users)} new users.")
            for user in new_users:
                new_user = all_users[all_users["public_key"] == user].iloc[0]
                for _, announcement in all_annoucements.iterrows():
                    if announcement["stealthAddress"] in processed_announcements:
                        continue
                    if parse_announcement(
                        new_user["public_key"],
                        announcement["ephemeralPubKey"], 
                        new_user["private_key"], 
                        announcement["stealthAddress"],
                        announcement["metadata"][0:4]
                    ):
                        msg = build_success_msg(announcement['stealthAddress'], announcement["ephemeralPubKey"])
                        print_with_timestamp("success")
                        print_with_timestamp(f"message sent to user {new_user['user_id']}:")
                        print_with_timestamp("stealth address: "+ announcement['stealthAddress'])
                        processed_announcements.add(announcement["stealthAddress"])
                        await context.bot.send_message(chat_id=str(new_user["user_id"]), text=msg)
                        await asyncio.sleep(0.5)
                        continue
            with open(new_user_file, "w") as file:
                file.write("")

        newest_announcements = all_annoucements[all_annoucements["tsAdded"] > int(datetime.datetime.utcnow().timestamp()) - 60*5]
        if len(newest_announcements.index) > 0:
            print_with_timestamp(f"{len(newest_announcements.index)} recent announcements found.")
            for _, user in all_users[~all_users["public_key"].isin(new_users)].iterrows():
                for _, announcement in newest_announcements.iterrows():
                    if announcement["stealthAddress"] in processed_announcements:
                        print_with_timestamp(f"announcements already processed.")
                        continue
                    if parse_announcement(
                        user["public_key"], 
                        announcement["ephemeralPubKey"], 
                        user["private_key"], 
                        announcement["stealthAddress"],
                        announcement["metadata"][0:4]
                    ):
                        msg = build_success_msg(announcement['stealthAddress'], announcement["ephemeralPubKey"])
                        await context.bot.send_message(chat_id=str(user["user_id"]), text=msg)
                        print_with_timestamp("success")
                        print_with_timestamp(f"message sent to user {user['user_id']}:")
                        print_with_timestamp("stealth address: "+ announcement['stealthAddress'])
                        processed_announcements.add(announcement["stealthAddress"])
                        await asyncio.sleep(0.5)
                        break

        # Save processed announcements
        if len(processed_announcements) > 0:
            with open(processed_announcements_file, "w") as file:
                file.write("\n".join(processed_announcements))

        # Sleep for a while before checking again (customize the interval as needed)
        await asyncio.sleep(60)
        print_with_timestamp(f"{len(user_state)} pending users.")
        print_with_timestamp(f"{len(all_users.index)} total users.")

        

if __name__ == '__main__':
    application = ApplicationBuilder().token(KEY).build()
    
    start_handler = CommandHandler('start', start)
    help_handler = CommandHandler('help', help_command)
    show_handler = CommandHandler('showkey', show_key)
    store_key_handler = MessageHandler(filters.TEXT & (~filters.COMMAND), handle_keys)

    
    application.add_handler(start_handler)
    application.add_handler(help_handler)
    application.add_handler(show_handler)
    application.add_handler(store_key_handler)
    
    ensure_future(parse_all_announcements(application))

    application.run_polling()
