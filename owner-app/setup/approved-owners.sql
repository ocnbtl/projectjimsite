INSERT INTO user(id,name,email,createdAt,updatedAt) VALUES('ce5be058-72fc-471b-b450-6f0f54d76453','Jim','james@masonrycolorcorrections.com',unixepoch()*1000,unixepoch()*1000) ON CONFLICT(email) DO NOTHING;
INSERT INTO user(id,name,email,createdAt,updatedAt) VALUES('b5c8848f-45ac-43a9-92e9-0ff736b8d2d6','Ocean','ocean@oceanbattelle.com',unixepoch()*1000,unixepoch()*1000) ON CONFLICT(email) DO NOTHING;
INSERT INTO members(user_id,role) SELECT id,'owner' FROM user WHERE email IN ('james@masonrycolorcorrections.com','ocean@oceanbattelle.com') ON CONFLICT(user_id) DO UPDATE SET role='owner';
